from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, bcrypt, jwt
from .routes.auth import bp as auth_bp
from .routes.lookups import bp as lookups_bp
from .routes.incidents import bp as incidents_bp
from .routes.dashboard import bp as dashboard_bp
from .routes.admin import bp as admin_bp
from .routes.setup import bp as setup_bp, seed_database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r'/api/*': {'origins': '*'}})
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(lookups_bp)
    app.register_blueprint(incidents_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(setup_bp)

    with app.app_context():
        seed_database()

    return app