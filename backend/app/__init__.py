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
from .routes.attendance import attendance_bp
from .routes.dashboard import dashboard_bp
from .routes.rehearsals import rehearsals_bp
from .routes.roles import roles_bp
from app.routes.profile import profile_bp
from .routes.music import music_bp



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
    app.register_blueprint(attendance_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(rehearsals_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(music_bp)


    with app.app_context():
        db.create_all()

        columns = {
            column["name"]
            for column in db.inspect(db.engine).get_columns("music")
        }

        if "file_data" not in columns:
            column_type = (
                "BYTEA"
                if db.engine.dialect.name == "postgresql"
                else "BLOB"
            )

            with db.engine.begin() as connection:
                connection.execute(
                    db.text(
                        f"ALTER TABLE music ADD COLUMN file_data {column_type}"
                    )
                )



    return app

