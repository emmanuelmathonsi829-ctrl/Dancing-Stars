from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import User, UserRole, Role, RolePermission, Permission
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

    if user.status != "ACTIVE":
        return jsonify({
            "error": "Account is disabled"
        }), 403

    roles = []
    permissions = set()

    user_roles = UserRole.query.filter_by(
        user_id=user.id
    ).all()

    for user_role in user_roles:

        role = Role.query.get(user_role.role_id)

        if not role:
            continue

        roles.append(role.name)

        role_permissions = RolePermission.query.filter_by(
            role_id=role.id
        ).all()

        for role_permission in role_permissions:

            permission = Permission.query.get(
                role_permission.permission_id
            )

            if permission:
                permissions.add(permission.name)

    if user.account_type in ["SHEPHERD", "ASSISTANT"]:

        all_permissions = Permission.query.all()

        permissions = {
            permission.name
            for permission in all_permissions
        }

    return jsonify({
        "id": user.id,
        "username": user.username,
        "account_type": user.account_type,
        "profile_picture": user.profile_picture,
        "must_change_password": user.must_change_password,
        "status": user.status,
        "roles": roles,
        "permissions": sorted(permissions)
    }), 200


@auth_bp.route("/delete-account", methods=["DELETE"])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.account_type == "SHEPHERD":
        return jsonify({
            "error": "The Shepherd account cannot be deleted."
        }), 403

    data = request.get_json() or {}

    password = data.get("password")

    if not password:
        return jsonify({
            "error": "Password is required"
        }), 400

    if not check_password(password, user.password_hash):
        return jsonify({
            "error": "Password is incorrect"
        }), 401

    user.status = "DISABLED"

    db.session.commit()

    return jsonify({
        "message": "Account deleted successfully"
    }), 200