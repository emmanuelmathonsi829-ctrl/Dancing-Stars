from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import User
from app.utils.auth import check_password, hash_password

from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required
)


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

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    data = request.get_json()

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({
            "error": "Current password and new password are required"
        }), 400

    if not check_password(current_password, user.password_hash):
        return jsonify({
            "error": "Current password is incorrect"
        }), 401

    if len(new_password) < 8:
        return jsonify({
            "error": "New password must be at least 8 characters"
        }), 400

    user.password_hash = hash_password(new_password)
    user.must_change_password = False

    db.session.commit()

    return jsonify({
        "message": "Password changed successfully"
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "account_type": user.account_type,
        "profile_picture": user.profile_picture,
        "must_change_password": user.must_change_password,
        "status": user.status
    }), 200