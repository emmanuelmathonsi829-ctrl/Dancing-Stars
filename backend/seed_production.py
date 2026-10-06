
from app import create_app
from app.extensions import db
from app.models import User, Role, Permission, UserRole, RolePermission
from app.utils.auth import hash_password


app = create_app()


PERMISSIONS = [
    ("attendance.view", "View attendance"),
    ("attendance.take", "Take attendance"),
    ("attendance.edit", "Edit attendance"),
    ("rehearsals.view", "View rehearsals"),
    ("rehearsals.manage", "Manage rehearsals"),
    ("uniform.view", "View uniforms"),
    ("uniform.manage", "Manage uniforms"),
    ("dance.view", "View dances"),
    ("dance.respond", "Respond to dance knowledge"),
    ("dance.manage", "Manage dances"),
    ("music.view", "View music"),
    ("music.play", "Play music"),
    ("music.download", "Download music"),
    ("music.manage", "Manage music"),
    ("dancers.view", "View dancers"),
    ("dancers.manage", "Manage dancers"),
    ("roles.view", "View roles"),
    ("roles.manage", "Manage roles"),
    ("reports.view", "View reports"),
    ("reports.manage", "Manage reports"),
]


ROLES = {
    "Dance Captain": [
        "dance.view",
        "dance.respond",
        "dance.manage",
    ]
}


with app.app_context():

    db.create_all()

    for name, description in PERMISSIONS:

        permission = Permission.query.filter_by(
            name=name
        ).first()

        if not permission:
            permission = Permission(
                name=name,
                description=description
            )

            db.session.add(permission)

    db.session.commit()

    for role_name, permission_names in ROLES.items():

        role = Role.query.filter_by(
            name=role_name
        ).first()

        if not role:
            role = Role(
                name=role_name,
                description=f"{role_name} role"
            )

            db.session.add(role)
            db.session.commit()

        for permission_name in permission_names:

            permission = Permission.query.filter_by(
                name=permission_name
            ).first()

            existing = RolePermission.query.filter_by(
                role_id=role.id,
                permission_id=permission.id
            ).first()

            if not existing:

                db.session.add(
                    RolePermission(
                        role_id=role.id,
                        permission_id=permission.id
                    )
                )

    db.session.commit()

    shepherd = User.query.filter_by(
        username="shepherd"
    ).first()

    if not shepherd:

        shepherd = User(
            username="shepherd",
            password_hash=hash_password("Shepherd123!"),
            account_type="SHEPHERD",
            must_change_password=True,
            status="ACTIVE"
        )

        db.session.add(shepherd)

    else:

        shepherd.account_type = "SHEPHERD"
        shepherd.status = "ACTIVE"

    db.session.commit()

    print("Production database setup complete.")
    print("Shepherd username: shepherd")
    print("The Shepherd account must change its initial password after login.")
