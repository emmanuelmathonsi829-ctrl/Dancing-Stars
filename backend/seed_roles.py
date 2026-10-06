from app import create_app
from app.extensions import db
from app.models import Role


app = create_app()

with app.app_context():

    role = Role.query.filter_by(name="Dance Captain").first()

    if not role:
        role = Role(
            name="Dance Captain",
            description="Helps manage dance-related activities."
        )

        db.session.add(role)
        db.session.commit()

        print("Dance Captain role created successfully.")
    else:
        print("Dance Captain role already exists.")