
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import Role, Permission, RolePermission, User, UserRole
from app.utils.permissions import permission_required

roles_bp = Blueprint(
    "roles",
    __name__,
    url_prefix="/api/roles"
)

@roles_bp.route("", methods=["GET"])
@permission_required("roles.view")
def get_roles():
    roles = Role.query.order_by(Role.name.asc()).all()

    result = []

    for role in roles:
        role_permissions = RolePermission.query.filter_by(
            role_id=role.id
        ).all()

        permissions = []

        for role_permission in role_permissions:
            permission = Permission.query.get(
                role_permission.permission_id
            )

            if permission:
                permissions.append({
                    "id": permission.id,
                    "name": permission.name,
                    "description": permission.description
                })

        result.append({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": permissions
        })

    return jsonify({"roles": result}), 200


@roles_bp.route("/permissions", methods=["GET"])
@permission_required("roles.view")
def get_permissions():
    permissions = Permission.query.order_by(
        Permission.name.asc()
    ).all()

    return jsonify({
        "permissions": [
            {
                "id": permission.id,
                "name": permission.name,
                "description": permission.description
            }
            for permission in permissions
        ]
    }), 200


@roles_bp.route("", methods=["POST"])
@permission_required("roles.manage")
def create_role():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    description = data.get("description")

    if not name:
        return jsonify({"error": "Role name is required"}), 400

    existing_role = Role.query.filter_by(name=name).first()

    if existing_role:
        return jsonify({"error": "Role already exists"}), 409

    role = Role(
        name=name,
        description=description
    )

    db.session.add(role)
    db.session.commit()

    return jsonify({
        "message": "Role created successfully",
        "role": {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": []
        }
    }), 201


@roles_bp.route("/<int:role_id>", methods=["PUT"])
@permission_required("roles.manage")
def update_role(role_id):
    role = Role.query.get(role_id)

    if not role:
        return jsonify({"error": "Role not found"}), 404

    data = request.get_json() or {}

    if "name" in data:
        name = data["name"].strip()

        if not name:
            return jsonify({"error": "Role name cannot be empty"}), 400

        existing_role = Role.query.filter(
            Role.name == name,
            Role.id != role.id
        ).first()

        if existing_role:
            return jsonify({"error": "Role already exists"}), 409

        role.name = name

    if "description" in data:
        role.description = data["description"]

    db.session.commit()

    return jsonify({
        "message": "Role updated successfully"
    }), 200


@roles_bp.route("/<int:role_id>/permissions", methods=["PUT"])
@permission_required("roles.manage")
def update_role_permissions(role_id):
    role = Role.query.get(role_id)

    if not role:
        return jsonify({"error": "Role not found"}), 404

    data = request.get_json() or {}
    permission_ids = data.get("permission_ids")

    if not isinstance(permission_ids, list):
        return jsonify({
            "error": "permission_ids must be a list"
        }), 400

    permissions = Permission.query.filter(
        Permission.id.in_(permission_ids)
    ).all()

    if len(permissions) != len(set(permission_ids)):
        return jsonify({
            "error": "One or more permissions do not exist"
        }), 400

    RolePermission.query.filter_by(
        role_id=role.id
    ).delete()

    for permission in permissions:
        db.session.add(
            RolePermission(
                role_id=role.id,
                permission_id=permission.id
            )
        )

    db.session.commit()

    return jsonify({
        "message": "Role permissions updated successfully"
    }), 200


@roles_bp.route("/<int:role_id>/users", methods=["GET"])
@permission_required("roles.view")
def get_role_users(role_id):
    role = Role.query.get(role_id)

    if not role:
        return jsonify({"error": "Role not found"}), 404

    assignments = UserRole.query.filter_by(
        role_id=role.id
    ).all()

    users = []

    for assignment in assignments:
        user = User.query.get(assignment.user_id)

        if user:
            users.append({
                "id": user.id,
                "username": user.username,
                "account_type": user.account_type,
                "status": user.status
            })

    return jsonify({
        "role": {
            "id": role.id,
            "name": role.name
        },
        "users": users
    }), 200


@roles_bp.route("/<int:role_id>/users/<int:user_id>", methods=["POST"])
@permission_required("roles.manage")
def assign_role(role_id, user_id):
    role = Role.query.get(role_id)

    if not role:
        return jsonify({"error": "Role not found"}), 404

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    existing_assignment = UserRole.query.filter_by(
        role_id=role.id,
        user_id=user.id
    ).first()

    if existing_assignment:
        return jsonify({
            "error": "User already has this role"
        }), 409

    assignment = UserRole(
        role_id=role.id,
        user_id=user.id
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify({
        "message": "Role assigned successfully"
    }), 201


@roles_bp.route("/<int:role_id>/users/<int:user_id>", methods=["DELETE"])
@permission_required("roles.manage")
def remove_role(role_id, user_id):
    assignment = UserRole.query.filter_by(
        role_id=role_id,
        user_id=user_id
    ).first()

    if not assignment:
        return jsonify({
            "error": "Role assignment not found"
        }), 404

    db.session.delete(assignment)
    db.session.commit()

    return jsonify({
        "message": "Role removed successfully"
    }), 200


@roles_bp.route("/<int:role_id>", methods=["DELETE"])
@permission_required("roles.manage")
def delete_role(role_id):
    role = Role.query.get(role_id)

    if not role:
        return jsonify({"error": "Role not found"}), 404

    UserRole.query.filter_by(
        role_id=role.id
    ).delete()

    RolePermission.query.filter_by(
        role_id=role.id
    ).delete()

    db.session.delete(role)
    db.session.commit()

    return jsonify({
        "message": "Role deleted successfully"
    }), 200

