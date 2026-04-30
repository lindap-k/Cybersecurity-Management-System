from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import User, AuditLog, Role, Department
from ..utils import role_required, get_current_user

bp = Blueprint('admin', __name__, url_prefix='/api')


@bp.get('/users')
@role_required('Administrator')
def users():
    return jsonify([user.to_dict() for user in User.query.order_by(User.name).all()])


@bp.post('/users')
@role_required('Administrator')
def create_user():
    data = request.get_json() or {}
    required = ['name', 'email', 'password', 'role']
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400

    email = data['email'].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    role = Role.query.filter_by(name=data['role']).first()
    if not role or role.name not in ['Employee', 'Analyst', 'Administrator']:
        return jsonify({'error': 'Role must be Employee, Analyst, or Administrator'}), 400

    department_id = data.get('department_id')
    if department_id:
        department = db.session.get(Department, department_id)
        if not department:
            return jsonify({'error': 'Department not found'}), 404

    user = User(
        name=data['name'].strip(),
        email=email,
        role_id=role.role_id,
        department_id=department_id,
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@bp.delete('/users/<int:user_id>')
@role_required('Administrator')
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    current_user = get_current_user()
    if current_user and current_user.user_id == user.user_id:
        return jsonify({'error': 'You cannot delete your own account'}), 400

    if user.role and user.role.name == 'Administrator':
        admin_count = User.query.join(Role).filter(Role.name == 'Administrator').count()
        if admin_count <= 1:
            return jsonify({'error': 'At least one administrator account must remain'}), 400

    assigned_incidents = list(user.assigned_incidents)
    for incident in assigned_incidents:
        incident.assigned_to = None
        if incident.status in ['Assigned', 'In Progress']:
            incident.status = 'Open'

    if user.department and user.department.manager_id == user.user_id:
        user.department.manager_id = None

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})


@bp.get('/audit-logs')
@role_required('Administrator')
def audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return jsonify([
        {
            'audit_id': item.audit_id,
            'incident_id': item.incident_id,
            'action': item.action,
            'actor_user_id': item.actor_user_id,
            'created_at': item.created_at.isoformat(),
            'details': item.details,
        }
        for item in logs
    ])
