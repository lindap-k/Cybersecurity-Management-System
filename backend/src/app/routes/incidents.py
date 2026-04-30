from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Incident, AttackType, SystemAsset, User
from ..utils import get_current_user, log_action, role_required

bp = Blueprint('incidents', __name__, url_prefix='/api/incidents')


def validate_payload(payload):
    required = ['title', 'description', 'severity']
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    if payload['severity'] not in {'Low', 'Medium', 'High', 'Critical'}:
        return 'Severity must be Low, Medium, High, or Critical'
    return None


def validate_status(status):
    allowed_statuses = {'Open', 'Assigned', 'In Progress', 'Resolved'}
    if status not in allowed_statuses:
        return f"Status must be one of: {', '.join(sorted(allowed_statuses))}"
    return None


@bp.get('')
@jwt_required()
def list_incidents():
    query = Incident.query
    severity = request.args.get('severity')
    status = request.args.get('status')
    department_id = request.args.get('department_id', type=int)

    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    if department_id:
        query = query.filter(Incident.department_id == department_id)

    return jsonify([item.to_dict() for item in query.order_by(Incident.reported_at.desc()).all()])


@bp.post('')
@jwt_required()
def create_incident():
    data = request.get_json() or {}
    error = validate_payload(data)
    if error:
        return jsonify({'error': error}), 400

    current_user = get_current_user()
    incident = Incident(
        title=data['title'],
        description=data['description'],
        severity=data['severity'],
        status=data.get('status', 'Open'),
        reported_by=current_user.user_id,
        assigned_to=data.get('assigned_to'),
        department_id=data.get('department_id', current_user.department_id),
        reported_at=datetime.utcnow(),
    )
    if data.get('attack_type_ids'):
        incident.attack_types = AttackType.query.filter(AttackType.attack_type_id.in_(data['attack_type_ids'])).all()
    if data.get('system_ids'):
        incident.systems = SystemAsset.query.filter(SystemAsset.system_id.in_(data['system_ids'])).all()

    db.session.add(incident)
    db.session.commit()
    log_action('INCIDENT_CREATED', actor_user_id=current_user.user_id, incident_id=incident.incident_id, details=f'Created incident {incident.title}')
    return jsonify(incident.to_dict()), 201


@bp.get('/<int:incident_id>')
@jwt_required()
def get_incident(incident_id):
    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    return jsonify(incident.to_dict())


@bp.put('/<int:incident_id>')
@role_required('Administrator', 'Analyst')
def update_incident(incident_id):
    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    data = request.get_json() or {}
    current_user = get_current_user()

    if current_user.role.name == 'Analyst':
        can_edit = incident.assigned_to == current_user.user_id
        if not can_edit:
            return jsonify({'error': 'Assign the incident to yourself before making updates'}), 403

        requested_assignee = data.get('assigned_to', incident.assigned_to)
        if requested_assignee != current_user.user_id:
            return jsonify({'error': 'Analysts can only keep incidents assigned to themselves'}), 403

    if 'severity' in data and data['severity'] not in {'Low', 'Medium', 'High', 'Critical'}:
        return jsonify({'error': 'Severity must be Low, Medium, High, or Critical'}), 400
    if 'status' in data:
        status_error = validate_status(data['status'])
        if status_error:
            return jsonify({'error': status_error}), 400

    if 'assigned_to' in data and data['assigned_to'] is not None:
        assignee = db.session.get(User, data['assigned_to'])
        if not assignee or assignee.role.name not in ['Analyst', 'Administrator']:
            return jsonify({'error': 'Assigned user must be an analyst or administrator'}), 400

    for field in ['title', 'description', 'severity', 'status', 'assigned_to', 'department_id', 'resolution_notes']:
        if field in data:
            setattr(incident, field, data[field])

    if 'attack_type_ids' in data:
        incident.attack_types = AttackType.query.filter(AttackType.attack_type_id.in_(data['attack_type_ids'])).all()
    if 'system_ids' in data:
        incident.systems = SystemAsset.query.filter(SystemAsset.system_id.in_(data['system_ids'])).all()
    if incident.status == 'Resolved':
        if not incident.resolved_at:
            incident.resolved_at = datetime.utcnow()
    else:
        incident.resolved_at = None

    db.session.commit()
    log_action('INCIDENT_UPDATED', actor_user_id=current_user.user_id, incident_id=incident.incident_id, details=f'Updated incident {incident.incident_id}')
    return jsonify(incident.to_dict())


@bp.patch('/<int:incident_id>/assign')
@role_required('Administrator', 'Analyst')
def assign_incident(incident_id):
    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    data = request.get_json() or {}
    current_user = get_current_user()
    analyst_id = data.get('assigned_to')
    if analyst_id is None:
        analyst_id = current_user.user_id

    analyst = db.session.get(User, analyst_id)
    if not analyst or analyst.role.name not in ['Analyst', 'Administrator']:
        return jsonify({'error': 'Assigned user must be an analyst or administrator'}), 400

    if current_user.role.name == 'Analyst' and analyst.user_id != current_user.user_id:
        return jsonify({'error': 'Analysts can only assign incidents to themselves'}), 403

    incident.assigned_to = analyst_id
    if incident.status == 'Open':
        incident.status = 'Assigned'
    db.session.commit()
    log_action('INCIDENT_ASSIGNED', actor_user_id=current_user.user_id, incident_id=incident.incident_id, details=f'Assigned to {analyst.name}')
    return jsonify(incident.to_dict())
