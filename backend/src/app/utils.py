from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from .extensions import db
from .models import User, AuditLog


def get_current_user():
    identity = get_jwt_identity()
    if not identity:
        return None
    return db.session.get(User, int(identity))


def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user or user.role.name not in allowed_roles:
                return jsonify({'error': 'Forbidden'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def log_action(action: str, actor_user_id=None, incident_id=None, details=None):
    db.session.add(AuditLog(action=action, actor_user_id=actor_user_id, incident_id=incident_id, details=details))
    db.session.commit()
