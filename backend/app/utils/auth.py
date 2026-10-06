from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import User

from werkzeug.security import generate_password_hash, check_password_hash


def hash_password(password):
    return generate_password_hash(password)


def check_password(password, password_hash):
    return check_password_hash(password_hash, password)


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "error": "Username and password are required"
        }), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({
            "error": "Invalid username or password"
        }), 401

    if user.status != "ACTIVE":
        return jsonify({
            "error": "Account is disabled"
        }), 403

    if not check_password(password, user.password_hash):
        return jsonify({
            "error": "Invalid username or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "account_type": user.account_type,
            "must_change_password": user.must_change_password
        }
    }), 200