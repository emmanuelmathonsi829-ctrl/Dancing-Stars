
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models import User
from app.utils.auth import hash_password
from app.utils.permissions import permission_required


dancers_bp = Blueprint(
    "dancers",
    __name__,
    url_prefix="/api/dancers"
)


@dancers_bp.route("", methods=["GET"])
@permission_required("dancers.view")
def get_dancers():

    dancers = User.query.filter_by(
        account_type="DANCER"
    ).order_by(
        User.username.asc()
    ).all()

    result = []

    for dancer in dancers:
        result.append({
            "id": dancer.id,
            "username": dancer.username,
            "profile_picture": dancer.profile_picture,
            "status": dancer.status,
            "must_change_password": dancer.must_change_password,
            "created_at": dancer.created_at.isoformat()
            if dancer.created_at else None
        })

    return jsonify({
        "dancers": result
    }), 200


@dancers_bp.route("", methods=["POST"])
@permission_required("dancers.manage")
def create_dancer():

    data = request.get_json() or {}

    username = data.get("username", "").strip()

    if not username:
        return jsonify({
            "error": "Username is required"
        }), 400

    existing_user = User.query.filter_by(
        username=username
    ).first()

    if existing_user:
        return jsonify({
            "error": "Username already exists"
        }), 409

    dancer = User(
        username=username,
        password_hash=hash_password(username),
        account_type="DANCER",
        must_change_password=True,
        status="ACTIVE"
    )

    db.session.add(dancer)
    db.session.commit()

    return jsonify({
        "message": "Dancer created successfully",
        "dancer": {
            "id": dancer.id,
            "username": dancer.username,
            "status": dancer.status,
            "must_change_password": dancer.must_change_password
        }
    }), 201


@dancers_bp.route("/<int:dancer_id>", methods=["GET"])
@permission_required("dancers.view")
def get_dancer(dancer_id):

    dancer = User.query.filter_by(
        id=dancer_id,
        account_type="DANCER"
    ).first()

    if not dancer:
        return jsonify({
            "error": "Dancer not found"
        }), 404

    return jsonify({
        "id": dancer.id,
        "username": dancer.username,
        "profile_picture": dancer.profile_picture,
        "status": dancer.status,
        "must_change_password": dancer.must_change_password,
        "created_at": dancer.created_at.isoformat()
        if dancer.created_at else None
    }), 200


@dancers_bp.route("/<int:dancer_id>", methods=["PUT"])
@permission_required("dancers.manage")
def update_dancer(dancer_id):

    dancer = User.query.filter_by(
        id=dancer_id,
        account_type="DANCER"
    ).first()

    if not dancer:
        return jsonify({
            "error": "Dancer not found"
        }), 404

    data = request.get_json() or {}

    username = data.get("username")

    if username is not None:

        username = username.strip()

        if not username:
            return jsonify({
                "error": "Username cannot be empty"
            }), 400

        existing_user = User.query.filter(
            User.username == username,
            User.id != dancer.id
        ).first()

        if existing_user:
            return jsonify({
                "error": "Username already exists"
            }), 409

        dancer.username = username

    if "status" in data:

        status = data["status"]

        if status not in ["ACTIVE", "DISABLED"]:
            return jsonify({
                "error": "Invalid status"
            }), 400

        dancer.status = status

    db.session.commit()

    return jsonify({
        "message": "Dancer updated successfully",
        "dancer": {
            "id": dancer.id,
            "username": dancer.username,
            "status": dancer.status
        }
    }), 200


@dancers_bp.route("/<int:dancer_id>/disable", methods=["PATCH"])
@permission_required("dancers.manage")
def disable_dancer(dancer_id):

    dancer = User.query.filter_by(
        id=dancer_id,
        account_type="DANCER"
    ).first()

    if not dancer:
        return jsonify({
            "error": "Dancer not found"
        }), 404

    dancer.status = "DISABLED"

    db.session.commit()

    return jsonify({
        "message": "Dancer disabled successfully"
    }), 200


@dancers_bp.route("/<int:dancer_id>/reset-password", methods=["PATCH"])
@permission_required("dancers.manage")
def reset_dancer_password(dancer_id):

    dancer = User.query.filter_by(
        id=dancer_id,
        account_type="DANCER"
    ).first()

    if not dancer:
        return jsonify({
            "error": "Dancer not found"
        }), 404

    dancer.password_hash = hash_password(dancer.username)
    dancer.must_change_password = True

    db.session.commit()

    return jsonify({
        "message": "Dancer password reset successfully"
    }), 200

