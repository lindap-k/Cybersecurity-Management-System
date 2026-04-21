from datetime import timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from ..extensions import db
from ..models import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.post('/register')
def register():
    data = request.get_json() or {}
    required = ['name', 'email', 'password', 'role_id']
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        name=data['name'],
        email=data['email'],
        role_id=data['role_id'],
        department_id=data.get('department_id'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully', 'user': user.to_dict()}), 201


@bp.post('/login')
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.user_id), expires_delta=timedelta(hours=8))
    return jsonify({'token': token, 'user': user.to_dict()})
