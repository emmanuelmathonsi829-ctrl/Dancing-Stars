from app import create_app
from app.extensions import db
from app.models import Role, Permission, RolePermission


app = create_app()

with app.app_context():

    role = Role.query.filter_by(name="Dance Captain").first()

    if not role:
        print("Dance Captain role does not exist.")
        exit()

    permission_names = [
        "dance.view",
        "dance.respond",
        "dance.manage",
    ]

    for permission_name in permission_names:

        permission = Permission.query.filter_by(
            name=permission_name
        ).first()

        if not permission:
            print(f"Permission not found: {permission_name}")
            continue

        existing = RolePermission.query.filter_by(
            role_id=role.id,
            permission_id=permission.id
        ).first()

        if not existing:
            role_permission = RolePermission(
                role_id=role.id,
                permission_id=permission.id
            )

            db.session.add(role_permission)

    db.session.commit()

    print("Dance Captain permissions assigned successfully.")