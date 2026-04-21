from datetime import datetime
from .extensions import db, bcrypt

incident_attack_map = db.Table(
    'incident_attack_map',
    db.Column('incident_id', db.Integer, db.ForeignKey('incidents.incident_id'), primary_key=True),
    db.Column('attack_type_id', db.Integer, db.ForeignKey('attack_types.attack_type_id'), primary_key=True),
)

incident_systems = db.Table(
    'incident_systems',
    db.Column('incident_id', db.Integer, db.ForeignKey('incidents.incident_id'), primary_key=True),
    db.Column('system_id', db.Integer, db.ForeignKey('systems.system_id'), primary_key=True),
)


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
    manager_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))


class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'))
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
    mitre_code = db.Column(db.String(50))
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
    owner_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))

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
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'))
    reported_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime)

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
            'attack_types': [item.to_dict() for item in self.attack_types],
            'systems': [item.to_dict() for item in self.systems],
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    audit_id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.Integer, db.ForeignKey('incidents.incident_id'))
    action = db.Column(db.String(120), nullable=False)
    actor_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)
