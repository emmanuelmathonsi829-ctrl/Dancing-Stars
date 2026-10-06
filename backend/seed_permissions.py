from app import create_app
from app.extensions import db
from app.models import Permission


PERMISSIONS = [
    ("attendance.view", "View attendance"),
    ("attendance.take", "Take attendance"),
    ("attendance.edit", "Edit attendance"),

    ("rehearsals.view", "View rehearsals"),
    ("rehearsals.manage", "Create, edit and remove rehearsals"),

    ("uniform.view", "View uniform requirements"),
    ("uniform.manage", "Create, edit and remove uniform requirements"),

    ("dance.view", "View dance knowledge"),
    ("dance.respond", "Update personal dance knowledge"),
    ("dance.manage", "Create, edit and remove dances"),

    ("music.view", "View music"),
    ("music.play", "Play music"),
    ("music.download", "Download music"),
    ("music.manage", "Upload, edit and remove music"),

    ("dancers.view", "View dancers"),
    ("dancers.manage", "Create, edit and disable dancer accounts"),

    ("roles.view", "View roles and permissions"),
    ("roles.manage", "Create, edit and remove roles and permissions"),

    ("reports.view", "View reports"),
    ("reports.manage", "Manage reports"),
]


app = create_app()

with app.app_context():

    for name, description in PERMISSIONS:

        existing_permission = Permission.query.filter_by(
            name=name
        ).first()

        if existing_permission:
            continue

        permission = Permission(
            name=name,
            description=description
        )

        db.session.add(permission)

    db.session.commit()

    print("Permissions seeded successfully.")