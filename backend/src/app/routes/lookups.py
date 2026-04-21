from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..models import Role, Department, AttackType, SystemAsset

bp = Blueprint('lookups', __name__, url_prefix='/api')


@bp.get('/roles')
@jwt_required(optional=True)
def roles():
    return jsonify([{'role_id': role.role_id, 'name': role.name, 'description': role.description} for role in Role.query.order_by(Role.name).all()])


@bp.get('/departments')
@jwt_required(optional=True)
def departments():
    return jsonify([{'department_id': dept.department_id, 'name': dept.name, 'manager_id': dept.manager_id} for dept in Department.query.order_by(Department.name).all()])


@bp.get('/attack-types')
@jwt_required()
def attack_types():
    return jsonify([item.to_dict() for item in AttackType.query.order_by(AttackType.name).all()])


@bp.get('/systems')
@jwt_required()
def systems():
    return jsonify([item.to_dict() for item in SystemAsset.query.order_by(SystemAsset.system_name).all()])
