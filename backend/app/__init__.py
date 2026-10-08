import os

from flask import Flask

from .extensions import db, jwt, cors
from .models import (
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    Music,
    Dance,
    DancerDance,
    Rehearsal,
    Attendance,
    UniformRequirement,
    DancerUniform,
    ActivityLog
)

from .routes.auth import auth_bp
from .routes.dance import dance_bp
from .routes.dancers import dancers_bp



def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "sqlite:///dancingstars.db"
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-later"
    )

    db.init_app(app)
    jwt.init_app(app)
    cors(app)

    app.register_blueprint(dance_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(dancers_bp)

    with app.app_context():
        db.create_all()

    return app

