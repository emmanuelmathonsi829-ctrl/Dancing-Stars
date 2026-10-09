from datetime import datetime
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(80), unique=True, nullable=False)

    password_hash = db.Column(db.String(255), nullable=False)

    account_type = db.Column(
        db.String(20),
        nullable=False,
        default="DANCER"
    )

    profile_picture = db.Column(
        db.LargeBinary,
        nullable=True
    )

    profile_picture_original = db.Column(
        db.LargeBinary,
        nullable=True
    )

    birthday_day = db.Column(
        db.Integer,
        nullable=True
    )

    birthday_month = db.Column(
        db.Integer,
        nullable=True
    )

    must_change_password = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="ACTIVE"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<User {self.username}>"

    

class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(80),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<Role {self.name}>"


class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def __repr__(self):
        return f"<Permission {self.name}>"


class UserRole(db.Model):
    __tablename__ = "user_roles"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    user = db.relationship(
        "User",
        backref=db.backref("user_roles", cascade="all, delete-orphan")
    )

    role = db.relationship(
        "Role",
        backref=db.backref("user_roles", cascade="all, delete-orphan")
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "role_id",
            name="unique_user_role"
        ),
    )


class RolePermission(db.Model):
    __tablename__ = "role_permissions"

    id = db.Column(db.Integer, primary_key=True)

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    permission_id = db.Column(
        db.Integer,
        db.ForeignKey("permissions.id"),
        nullable=False
    )

    role = db.relationship(
        "Role",
        backref=db.backref(
            "role_permissions",
            cascade="all, delete-orphan"
        )
    )

    permission = db.relationship(
        "Permission",
        backref=db.backref(
            "role_permissions",
            cascade="all, delete-orphan"
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "role_id",
            "permission_id",
            name="unique_role_permission"
        ),
    )


class Music(db.Model):
    __tablename__ = "music"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(150),
        nullable=False
    )

    artist = db.Column(
        db.String(150),
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    file_path = db.Column(
        db.String(500),
        nullable=True
    )

    file_data = db.Column(
        db.LargeBinary,
        nullable=True
    )

    uploaded_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    uploader = db.relationship(
        "User",
        backref=db.backref("uploaded_music", lazy=True)
    )

    def __repr__(self):
        return f"<Music {self.title}>"

class Dance(db.Model):
    __tablename__ = "dances"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def __repr__(self):
        return f"<Dance {self.name}>"

class DancerDance(db.Model):
    __tablename__ = "dancer_dances"

    id = db.Column(db.Integer, primary_key=True)

    dancer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    dance_id = db.Column(
        db.Integer,
        db.ForeignKey("dances.id"),
        nullable=False
    )

    knowledge_status = db.Column(
        db.String(10),
        nullable=False,
        default="NO"
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    dancer = db.relationship(
        "User",
        backref=db.backref("dance_knowledge", lazy=True)
    )

    dance = db.relationship(
        "Dance",
        backref=db.backref("dancer_knowledge", lazy=True)
    )

    __table_args__ = (
        db.UniqueConstraint(
            "dancer_id",
            "dance_id",
            name="unique_dancer_dance"
        ),
    )

    def __repr__(self):
        return f"<DancerDance {self.dancer_id} - {self.dance_id}>"

class Rehearsal(db.Model):
    __tablename__ = "rehearsals"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    rehearsal_date = db.Column(
        db.Date,
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=True
    )

    end_time = db.Column(
        db.Time,
        nullable=True
    )

    location = db.Column(
        db.String(200),
        nullable=True
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    creator = db.relationship(
        "User",
        backref=db.backref("created_rehearsals", lazy=True)
    )

    def __repr__(self):
        return f"<Rehearsal {self.title}>"

class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)

    rehearsal_id = db.Column(
        db.Integer,
        db.ForeignKey("rehearsals.id"),
        nullable=False
    )

    dancer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="ABSENT"
    )

    marked_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    marked_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    rehearsal = db.relationship(
        "Rehearsal",
        backref=db.backref("attendance_records", lazy=True)
    )

    dancer = db.relationship(
        "User",
        foreign_keys=[dancer_id],
        backref=db.backref("attendance_records", lazy=True)
    )

    marker = db.relationship(
        "User",
        foreign_keys=[marked_by]
    )

    __table_args__ = (
        db.UniqueConstraint(
            "rehearsal_id",
            "dancer_id",
            name="unique_rehearsal_dancer_attendance"
        ),
    )

    def __repr__(self):
        return f"<Attendance {self.rehearsal_id} - {self.dancer_id}>"

class DancerUniform(db.Model):
    __tablename__ = "dancer_uniforms"

    id = db.Column(db.Integer, primary_key=True)

    dancer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    uniform_id = db.Column(
        db.Integer,
        db.ForeignKey("uniform_requirements.id"),
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="DO_NOT_HAVE"
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    dancer = db.relationship(
        "User",
        backref=db.backref("uniform_statuses", lazy=True)
    )

    uniform = db.relationship(
        "UniformRequirement",
        backref=db.backref("dancer_statuses", lazy=True)
    )

    __table_args__ = (
        db.UniqueConstraint(
            "dancer_id",
            "uniform_id",
            name="unique_dancer_uniform"
        ),
    )

    def __repr__(self):
        return f"<DancerUniform {self.dancer_id} - {self.uniform_id}>"

class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    action = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship(
        "User",
        backref=db.backref("activity_logs", lazy=True)
    )

    def __repr__(self):
        return f"<ActivityLog {self.action}>"


class UniformRequirement(db.Model):
    __tablename__ = "uniform_requirements"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    creator = db.relationship(
        "User",
        backref=db.backref("created_uniform_requirements", lazy=True)
    )

    def __repr__(self):
        return f"<UniformRequirement {self.name}>"