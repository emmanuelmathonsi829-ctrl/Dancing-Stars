from app import create_app
from app.extensions import db
from sqlalchemy import inspect, text

app = create_app()

with app.app_context():
    inspector = inspect(db.engine)
    columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = db.engine.dialect.name

    if dialect == "postgresql":
        if "profile_picture" not in columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN profile_picture BYTEA")
            )
        else:
            db.session.execute(
                text("""
                    ALTER TABLE users
                    ALTER COLUMN profile_picture TYPE BYTEA
                    USING NULL
                """)
            )

        if "profile_picture_original" not in columns:
            db.session.execute(
                text("""
                    ALTER TABLE users
                    ADD COLUMN profile_picture_original BYTEA
                """)
            )
        else:
            db.session.execute(
                text("""
                    ALTER TABLE users
                    ALTER COLUMN profile_picture_original TYPE BYTEA
                    USING NULL
                """)
            )

    else:
        if "profile_picture" not in columns:
            db.session.execute(
                text("""
                    ALTER TABLE users
                    ADD COLUMN profile_picture BLOB
                """)
            )

        if "profile_picture_original" not in columns:
            db.session.execute(
                text("""
                    ALTER TABLE users
                    ADD COLUMN profile_picture_original BLOB
                """)
            )

    if "birthday_day" not in columns:
        db.session.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN birthday_day INTEGER
            """)
        )

    if "birthday_month" not in columns:
        db.session.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN birthday_month INTEGER
            """)
        )

    db.session.commit()

    print("Profile picture and birthday columns are ready.")