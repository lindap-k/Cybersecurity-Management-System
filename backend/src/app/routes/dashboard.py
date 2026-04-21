from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from ..models import Incident, Department

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@bp.get('/summary')
@jwt_required()
def summary():
    total_incidents = Incident.query.count()
    open_incidents = Incident.query.filter(Incident.status != 'Resolved').count()
    critical_incidents = Incident.query.filter_by(severity='Critical').count()
    resolved_incidents = Incident.query.filter_by(status='Resolved').count()

    resolved_items = Incident.query.filter(Incident.resolved_at.isnot(None)).all()
    resolution_hours = [
        (item.resolved_at - item.reported_at).total_seconds() / 3600
        for item in resolved_items
        if item.reported_at and item.resolved_at
    ]
    avg_resolution_hours = round(sum(resolution_hours) / len(resolution_hours), 2) if resolution_hours else None

    incidents_by_severity = Incident.query.with_entities(Incident.severity, func.count(Incident.incident_id)).group_by(Incident.severity).all()
    incidents_by_status = Incident.query.with_entities(Incident.status, func.count(Incident.incident_id)).group_by(Incident.status).all()

    return jsonify({
        'cards': {
            'total_incidents': total_incidents,
            'open_incidents': open_incidents,
            'critical_incidents': critical_incidents,
            'resolved_incidents': resolved_incidents,
            'avg_resolution_hours': avg_resolution_hours,
        },
        'incidents_by_severity': [{'severity': severity, 'count': count} for severity, count in incidents_by_severity],
        'incidents_by_status': [{'status': status, 'count': count} for status, count in incidents_by_status],
    })


@bp.get('/high-risk-departments')
@jwt_required()
def high_risk_departments():
    results = Department.query.with_entities(
        Department.name,
        func.count(Incident.incident_id).label('incident_count')
    ).join(Incident, Incident.department_id == Department.department_id).group_by(Department.name).order_by(func.count(Incident.incident_id).desc()).all()
    return jsonify([{'department': name, 'incident_count': incident_count} for name, incident_count in results])
