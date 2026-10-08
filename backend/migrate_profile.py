from app import create_app
from app.extensions import db
from sqlalchemy import inspect, text

app = create_app()

with app.app_context():
    inspector = inspect(db.engine)
    columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = db.engine.dialect.name

    if "profile_picture" in columns:
        db.session.execute(text("ALTER TABLE users DROP COLUMN profile_picture"))

    if "profile_picture_original" in columns:
        db.session.execute(text("ALTER TABLE users DROP COLUMN profile_picture_original"))

    if dialect == "postgresql":
        db.session.execute(text("""
            ALTER TABLE users
            ADD COLUMN profile_picture BYTEA
        """))

        db.session.execute(text("""
            ALTER TABLE users
            ADD COLUMN profile_picture_original BYTEA
        """))
    else:
        db.session.execute(text("""
            ALTER TABLE users
            ADD COLUMN profile_picture BLOB
        """))

        db.session.execute(text("""
            ALTER TABLE users
            ADD COLUMN profile_picture_original BLOB
        """))

    if "birthday_day" not in columns:
        db.session.execute(text("""
            ALTER TABLE users
            ADD COLUMN birthday_day INTEGER
        """))

    if "birthday_month" not in columns:
        db.session.execute(text("""
            ALTER TABLE users
            ADD COLUMN birthday_month INTEGER
        """))

    db.session.commit()

    print("Profile picture and birthday columns are ready.")