from app import create_app
from app.extensions import db
from app.models import User, Role, UserRole
from app.utils.auth import hash_password


app = create_app()

with app.app_context():

    dancer = User.query.filter_by(username="testdancer").first()

    if not dancer:
        dancer = User(
            username="testdancer",
            password_hash=hash_password("Test12345!"),
            account_type="DANCER",
            must_change_password=True,
            status="ACTIVE"
        )

        db.session.add(dancer)
        db.session.commit()

    role = Role.query.filter_by(name="Dance Captain").first()

    existing_role = UserRole.query.filter_by(
        user_id=dancer.id,
        role_id=role.id
    ).first()

    if not existing_role:
        user_role = UserRole(
            user_id=dancer.id,
            role_id=role.id
        )

        db.session.add(user_role)
        db.session.commit()

    print("Test dancer created and Dance Captain role assigned.")