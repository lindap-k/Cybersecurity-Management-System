from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from sqlalchemy import func
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# --- Config ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'mysql+pymysql://root:password@localhost/cims_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-this-in-production')

CORS(app, resources={r'/api/*': {'origins': '*'}})
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# --- Association tables ---
incident_attack_map = db.Table(
    'incident_attack_map',
    db.Column('incident_id', db.Integer, db.ForeignKey('incidents.incident_id'), primary_key=True),
    db.Column('attack_type_id', db.Integer, db.ForeignKey('attack_types.attack_type_id'), primary_key=True)
)

incident_systems = db.Table(
    'incident_systems',
    db.Column('incident_id', db.Integer, db.ForeignKey('incidents.incident_id'), primary_key=True),
    db.Column('system_id', db.Integer, db.ForeignKey('systems.system_id'), primary_key=True)
)

# --- Models ---
class Role(db.Model):
    __tablename__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))
    users = db.relationship('User', backref='role', lazy=True)


class Department(db.Model):
    __tablename__ = 'departments'
    department_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)


class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    department = db.relationship('Department', foreign_keys=[department_id], backref='users')

    def set_password(self, raw_password: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(raw_password).decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'role': self.role.name if self.role else None,
            'department': self.department.name if self.department else None,
        }


class AttackType(db.Model):
    __tablename__ = 'attack_types'
    attack_type_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    mitre_code = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text)

    def to_dict(self):
        return {
            'attack_type_id': self.attack_type_id,
            'name': self.name,
            'mitre_code': self.mitre_code,
            'description': self.description,
        }


class SystemAsset(db.Model):
    __tablename__ = 'systems'
    system_id = db.Column(db.Integer, primary_key=True)
    system_name = db.Column(db.String(120), nullable=False, unique=True)
    criticality_level = db.Column(db.String(20), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)

    owner = db.relationship('User', backref='owned_systems', foreign_keys=[owner_id])

    def to_dict(self):
        return {
            'system_id': self.system_id,
            'system_name': self.system_name,
            'criticality_level': self.criticality_level,
            'owner_id': self.owner_id,
        }


class Incident(db.Model):
    __tablename__ = 'incidents'
    incident_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(30), nullable=False, default='Open')
    reported_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=True)
    reported_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)

    reporter = db.relationship('User', foreign_keys=[reported_by], backref='reported_incidents')
    analyst = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_incidents')
    department = db.relationship('Department', backref='incidents')
    attack_types = db.relationship('AttackType', secondary=incident_attack_map, backref='incidents')
    systems = db.relationship('SystemAsset', secondary=incident_systems, backref='incidents')

    def to_dict(self):
        return {
            'incident_id': self.incident_id,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'status': self.status,
            'reported_by': self.reporter.name if self.reporter else None,
            'assigned_to': self.analyst.name if self.analyst else None,
            'department': self.department.name if self.department else None,
            'reported_at': self.reported_at.isoformat() if self.reported_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'attack_types': [a.to_dict() for a in self.attack_types],
            'systems': [s.to_dict() for s in self.systems],
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    audit_id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.Integer, db.ForeignKey('incidents.incident_id'), nullable=True)
    action = db.Column(db.String(120), nullable=False)
    actor_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)


# --- Helpers ---
def current_user():
    identity = get_jwt_identity()
    if not identity:
        return None
    return User.query.get(identity)


def log_action(action: str, actor_user_id=None, incident_id=None, details=None):
    entry = AuditLog(
        action=action,
        actor_user_id=actor_user_id,
        incident_id=incident_id,
        details=details,
    )
    db.session.add(entry)
    db.session.commit()


def role_required(*allowed_roles):
    def decorator(fn):
        from functools import wraps

        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user or user.role.name not in allowed_roles:
                return jsonify({'error': 'Forbidden'}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def validate_incident_payload(payload):
    required = ['title', 'description', 'severity']
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"

    valid_severities = {'Low', 'Medium', 'High', 'Critical'}
    if payload['severity'] not in valid_severities:
        return 'Invalid severity value'

    return None


# --- Seed route ---
@app.route('/api/setup', methods=['POST'])
def setup():
    db.create_all()

    role_names = ['Employee', 'Analyst', 'Administrator']
    for role_name in role_names:
        if not Role.query.filter_by(name=role_name).first():
            db.session.add(Role(name=role_name))
    db.session.commit()

    if not Department.query.filter_by(name='IT').first():
        db.session.add(Department(name='IT'))
    if not Department.query.filter_by(name='Finance').first():
        db.session.add(Department(name='Finance'))
    db.session.commit()

    if not AttackType.query.first():
        db.session.add_all([
            AttackType(name='Phishing', mitre_code='T1566', description='Email-based social engineering'),
            AttackType(name='Malware', mitre_code='T1204', description='Malicious software infection'),
            AttackType(name='Ransomware', mitre_code='T1486', description='Data encryption for extortion'),
            AttackType(name='Unauthorized Access', mitre_code='T1078', description='Improper account access'),
        ])
        db.session.commit()

    admin_role = Role.query.filter_by(name='Administrator').first()
    it_dept = Department.query.filter_by(name='IT').first()
    admin = User.query.filter_by(email='admin@cyberguard.local').first()
    if not admin:
        admin = User(name='Admin User', email='admin@cyberguard.local', role_id=admin_role.role_id, department_id=it_dept.department_id)
        admin.set_password('Admin123!')
        db.session.add(admin)
        db.session.commit()

    return jsonify({'message': 'Database initialized', 'default_admin': 'admin@cyberguard.local / Admin123!'})


# --- Auth routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    if not data.get('name') or not data.get('email') or not data.get('password') or not data.get('role_id'):
        return jsonify({'error': 'name, email, password, and role_id are required'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        name=data['name'],
        email=data['email'],
        role_id=data['role_id'],
        department_id=data.get('department_id')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully', 'user': user.to_dict()}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.user_id), expires_delta=timedelta(hours=8))
    return jsonify({
        'token': token,
        'user': user.to_dict()
    })


# --- Lookup endpoints ---
@app.route('/api/roles', methods=['GET'])
@jwt_required(optional=True)
def get_roles():
    roles = Role.query.all()
    return jsonify([{'role_id': r.role_id, 'name': r.name, 'description': r.description} for r in roles])


@app.route('/api/departments', methods=['GET'])
@jwt_required(optional=True)
def get_departments():
    departments = Department.query.all()
    return jsonify([
        {'department_id': d.department_id, 'name': d.name, 'manager_id': d.manager_id}
        for d in departments
    ])


@app.route('/api/attack-types', methods=['GET'])
@jwt_required()
def get_attack_types():
    attack_types = AttackType.query.order_by(AttackType.name.asc()).all()
    return jsonify([a.to_dict() for a in attack_types])


@app.route('/api/systems', methods=['GET'])
@jwt_required()
def get_systems():
    systems = SystemAsset.query.order_by(SystemAsset.system_name.asc()).all()
    return jsonify([s.to_dict() for s in systems])


@app.route('/api/systems', methods=['POST'])
@role_required('Administrator', 'Analyst')
def create_system():
    data = request.get_json() or {}
    if not data.get('system_name') or not data.get('criticality_level'):
        return jsonify({'error': 'system_name and criticality_level are required'}), 400

    system = SystemAsset(
        system_name=data['system_name'],
        criticality_level=data['criticality_level'],
        owner_id=data.get('owner_id')
    )
    db.session.add(system)
    db.session.commit()
    return jsonify(system.to_dict()), 201


# --- Incident endpoints ---
@app.route('/api/incidents', methods=['GET'])
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

    incidents = query.order_by(Incident.reported_at.desc()).all()
    return jsonify([incident.to_dict() for incident in incidents])


@app.route('/api/incidents', methods=['POST'])
@jwt_required()
def create_incident():
    data = request.get_json() or {}
    error = validate_incident_payload(data)
    if error:
        return jsonify({'error': error}), 400

    user = current_user()

    incident = Incident(
        title=data['title'],
        description=data['description'],
        severity=data['severity'],
        status=data.get('status', 'Open'),
        reported_by=user.user_id,
        assigned_to=data.get('assigned_to'),
        department_id=data.get('department_id', user.department_id),
        reported_at=datetime.utcnow(),
    )

    if data.get('attack_type_ids'):
        incident.attack_types = AttackType.query.filter(AttackType.attack_type_id.in_(data['attack_type_ids'])).all()

    if data.get('system_ids'):
        incident.systems = SystemAsset.query.filter(SystemAsset.system_id.in_(data['system_ids'])).all()

    db.session.add(incident)
    db.session.commit()

    log_action(
        action='INCIDENT_CREATED',
        actor_user_id=user.user_id,
        incident_id=incident.incident_id,
        details=f'Incident {incident.title} created'
    )

    return jsonify(incident.to_dict()), 201


@app.route('/api/incidents/<int:incident_id>', methods=['GET'])
@jwt_required()
def get_incident(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    return jsonify(incident.to_dict())


@app.route('/api/incidents/<int:incident_id>', methods=['PUT'])
@role_required('Administrator', 'Analyst')
def update_incident(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    data = request.get_json() or {}

    for field in ['title', 'description', 'severity', 'status', 'assigned_to', 'department_id']:
        if field in data:
            setattr(incident, field, data[field])

    if 'attack_type_ids' in data:
        incident.attack_types = AttackType.query.filter(AttackType.attack_type_id.in_(data['attack_type_ids'])).all()

    if 'system_ids' in data:
        incident.systems = SystemAsset.query.filter(SystemAsset.system_id.in_(data['system_ids'])).all()

    if data.get('status') == 'Resolved' and not incident.resolved_at:
        incident.resolved_at = datetime.utcnow()

    db.session.commit()

    user = current_user()
    log_action(
        action='INCIDENT_UPDATED',
        actor_user_id=user.user_id,
        incident_id=incident.incident_id,
        details=f'Incident {incident.incident_id} updated'
    )

    return jsonify(incident.to_dict())


@app.route('/api/incidents/<int:incident_id>/assign', methods=['PATCH'])
@role_required('Administrator')
def assign_incident(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    data = request.get_json() or {}
    analyst_id = data.get('assigned_to')

    analyst = User.query.get(analyst_id)
    if not analyst or analyst.role.name not in ['Analyst', 'Administrator']:
        return jsonify({'error': 'Assigned user must be an analyst or administrator'}), 400

    incident.assigned_to = analyst_id
    db.session.commit()

    user = current_user()
    log_action(
        action='INCIDENT_ASSIGNED',
        actor_user_id=user.user_id,
        incident_id=incident.incident_id,
        details=f'Assigned to analyst {analyst.name}'
    )

    return jsonify(incident.to_dict())


# --- User management ---
@app.route('/api/users', methods=['GET'])
@role_required('Administrator')
def list_users():
    users = User.query.order_by(User.name.asc()).all()
    return jsonify([u.to_dict() for u in users])


# --- Dashboard analytics ---
@app.route('/api/dashboard/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    total_incidents = Incident.query.count()
    open_incidents = Incident.query.filter(Incident.status != 'Resolved').count()
    critical_incidents = Incident.query.filter_by(severity='Critical').count()
    resolved_incidents = Incident.query.filter_by(status='Resolved').count()

    avg_resolution_hours = db.session.query(
        func.avg(func.timestampdiff(db.text('HOUR'), Incident.reported_at, Incident.resolved_at))
    ).filter(Incident.resolved_at.isnot(None)).scalar()

    incidents_by_severity = db.session.query(
        Incident.severity,
        func.count(Incident.incident_id)
    ).group_by(Incident.severity).all()

    incidents_by_status = db.session.query(
        Incident.status,
        func.count(Incident.incident_id)
    ).group_by(Incident.status).all()

    return jsonify({
        'cards': {
            'total_incidents': total_incidents,
            'open_incidents': open_incidents,
            'critical_incidents': critical_incidents,
            'resolved_incidents': resolved_incidents,
            'avg_resolution_hours': round(float(avg_resolution_hours), 2) if avg_resolution_hours else None,
        },
        'incidents_by_severity': [
            {'severity': severity, 'count': count} for severity, count in incidents_by_severity
        ],
        'incidents_by_status': [
            {'status': status, 'count': count} for status, count in incidents_by_status
        ]
    })


@app.route('/api/dashboard/high-risk-departments', methods=['GET'])
@jwt_required()
def high_risk_departments():
    results = db.session.query(
        Department.name,
        func.count(Incident.incident_id).label('incident_count')
    ).join(Incident, Incident.department_id == Department.department_id).group_by(Department.name).order_by(func.count(Incident.incident_id).desc()).all()

    return jsonify([
        {'department': dept_name, 'incident_count': incident_count}
        for dept_name, incident_count in results
    ])


@app.route('/api/audit-logs', methods=['GET'])
@role_required('Administrator')
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return jsonify([
        {
            'audit_id': log.audit_id,
            'incident_id': log.incident_id,
            'action': log.action,
            'actor_user_id': log.actor_user_id,
            'created_at': log.created_at.isoformat(),
            'details': log.details,
        }
        for log in logs
    ])


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'CIMS API'})


if __name__ == '__main__':
    app.run(debug=True)
