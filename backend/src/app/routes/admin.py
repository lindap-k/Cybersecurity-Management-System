from flask import Blueprint, jsonify
from ..models import User, AuditLog
from ..utils import role_required

bp = Blueprint('admin', __name__, url_prefix='/api')


@bp.get('/users')
@role_required('Administrator')
def users():
    return jsonify([user.to_dict() for user in User.query.order_by(User.name).all()])


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
