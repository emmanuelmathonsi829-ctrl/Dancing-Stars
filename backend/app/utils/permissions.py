from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import User, UserRole, RolePermission


def has_permission(user, permission_name):
    # Shepherds and Assistants have full access
    if user.account_type in ["SHEPHERD", "ASSISTANT"]:
        return True

    user_roles = UserRole.query.filter_by(
        user_id=user.id
    ).all()

    for user_role in user_roles:
        role_permission = RolePermission.query.filter_by(
            role_id=user_role.role_id
        ).join(
            RolePermission.permission
        ).filter_by(
            name=permission_name
        ).first()

        if role_permission:
            return True

    return False


def permission_required(permission_name):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()

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

            if not has_permission(user, permission_name):
                return jsonify({
                    "error": "Permission denied"
                }), 403

            return function(*args, **kwargs)

        return wrapper

    return decorator