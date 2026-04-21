from flask import Blueprint, jsonify
from ..extensions import db
from ..models import Role, Department, AttackType, User, SystemAsset

bp = Blueprint('setup', __name__, url_prefix='/api')


def seed_database():
    db.create_all()

    role_defaults = {
        'Employee': 'Can report incidents',
        'Analyst': 'Can review and manage incidents',
        'Administrator': 'Full system access',
    }
    for name, description in role_defaults.items():
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name, description=description))
    db.session.commit()

    for dept_name in ['IT', 'Finance', 'Operations', 'HR']:
        if not Department.query.filter_by(name=dept_name).first():
            db.session.add(Department(name=dept_name))
    db.session.commit()

    attack_defaults = [
        ('Phishing', 'T1566', 'Email-based social engineering'),
        ('Malware', 'T1204', 'Malicious software execution'),
        ('Ransomware', 'T1486', 'Data encryption for extortion'),
        ('Unauthorized Access', 'T1078', 'Improper account access'),
    ]
    for name, mitre_code, description in attack_defaults:
        if not AttackType.query.filter_by(name=name).first():
            db.session.add(AttackType(name=name, mitre_code=mitre_code, description=description))
    db.session.commit()

    admin_role = Role.query.filter_by(name='Administrator').first()
    analyst_role = Role.query.filter_by(name='Analyst').first()
    employee_role = Role.query.filter_by(name='Employee').first()
    it_department = Department.query.filter_by(name='IT').first()

    users = [
        ('Admin User', 'admin@cyberguard.local', 'Admin123!', admin_role),
        ('Security Analyst', 'analyst@cyberguard.local', 'Analyst123!', analyst_role),
        ('Employee User', 'employee@cyberguard.local', 'Employee123!', employee_role),
    ]
    for name, email, password, role in users:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email, role_id=role.role_id, department_id=it_department.department_id)
            user.set_password(password)
            db.session.add(user)
    db.session.commit()

    owner = User.query.filter_by(email='admin@cyberguard.local').first()
    systems = [
        ('Email Gateway', 'High'),
        ('HR Portal', 'Medium'),
        ('Finance Server', 'Critical'),
    ]
    for system_name, criticality_level in systems:
        if not SystemAsset.query.filter_by(system_name=system_name).first():
            db.session.add(SystemAsset(system_name=system_name, criticality_level=criticality_level, owner_id=owner.user_id if owner else None))
    db.session.commit()


@bp.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'CIMS API'})


@bp.post('/setup')
def setup():
    seed_database()
    return jsonify({
        'message': 'Database initialized',
        'default_users': [
            {'email': 'admin@cyberguard.local', 'password': 'Admin123!', 'role': 'Administrator'},
            {'email': 'analyst@cyberguard.local', 'password': 'Analyst123!', 'role': 'Analyst'},
            {'email': 'employee@cyberguard.local', 'password': 'Employee123!', 'role': 'Employee'},
        ],
    })
