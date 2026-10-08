
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User, Rehearsal
from app.utils.permissions import permission_required

rehearsals_bp = Blueprint(
    "rehearsals",
    __name__,
    url_prefix="/api/rehearsals"
)

@rehearsals_bp.route("", methods=["GET"])
@permission_required("rehearsals.view")
def get_rehearsals():
    rehearsals = Rehearsal.query.order_by(
        Rehearsal.rehearsal_date.desc(),
        Rehearsal.start_time.desc()
    ).all()

    result = []

    for rehearsal in rehearsals:
        result.append({
            "id": rehearsal.id,
            "title": rehearsal.title,
            "description": rehearsal.description,
            "rehearsal_date": rehearsal.rehearsal_date.isoformat(),
            "start_time": rehearsal.start_time.isoformat()
            if rehearsal.start_time else None,
            "end_time": rehearsal.end_time.isoformat()
            if rehearsal.end_time else None,
            "location": rehearsal.location
        })

    return jsonify({"rehearsals": result}), 200


@rehearsals_bp.route("", methods=["POST"])
@permission_required("rehearsals.manage")
def create_rehearsal():
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description")
    rehearsal_date = data.get("rehearsal_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    location = data.get("location")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    if not rehearsal_date:
        return jsonify({"error": "Rehearsal date is required"}), 400

    try:
        rehearsal_date = datetime.strptime(
            rehearsal_date,
            "%Y-%m-%d"
        ).date()
    except ValueError:
        return jsonify({"error": "Invalid rehearsal date"}), 400

    parsed_start_time = None
    parsed_end_time = None

    if start_time:
        try:
            parsed_start_time = datetime.strptime(
                start_time,
                "%H:%M"
            ).time()
        except ValueError:
            return jsonify({"error": "Invalid start time"}), 400

    if end_time:
        try:
            parsed_end_time = datetime.strptime(
                end_time,
                "%H:%M"
            ).time()
        except ValueError:
            return jsonify({"error": "Invalid end time"}), 400

    user_id = get_jwt_identity()

    rehearsal = Rehearsal(
        title=title,
        description=description,
        rehearsal_date=rehearsal_date,
        start_time=parsed_start_time,
        end_time=parsed_end_time,
        location=location,
        created_by=user_id
    )

    db.session.add(rehearsal)
    db.session.commit()

    return jsonify({
        "message": "Rehearsal created successfully",
        "rehearsal": {
            "id": rehearsal.id,
            "title": rehearsal.title,
            "rehearsal_date": rehearsal.rehearsal_date.isoformat(),
            "start_time": rehearsal.start_time.isoformat()
            if rehearsal.start_time else None,
            "end_time": rehearsal.end_time.isoformat()
            if rehearsal.end_time else None,
            "location": rehearsal.location
        }
    }), 201


@rehearsals_bp.route("/<int:rehearsal_id>", methods=["GET"])
@permission_required("rehearsals.view")
def get_rehearsal(rehearsal_id):
    rehearsal = Rehearsal.query.get(rehearsal_id)

    if not rehearsal:
        return jsonify({"error": "Rehearsal not found"}), 404

    return jsonify({
        "id": rehearsal.id,
        "title": rehearsal.title,
        "description": rehearsal.description,
        "rehearsal_date": rehearsal.rehearsal_date.isoformat(),
        "start_time": rehearsal.start_time.isoformat()
        if rehearsal.start_time else None,
        "end_time": rehearsal.end_time.isoformat()
        if rehearsal.end_time else None,
        "location": rehearsal.location
    }), 200


@rehearsals_bp.route("/<int:rehearsal_id>", methods=["PUT"])
@permission_required("rehearsals.manage")
def update_rehearsal(rehearsal_id):
    rehearsal = Rehearsal.query.get(rehearsal_id)

    if not rehearsal:
        return jsonify({"error": "Rehearsal not found"}), 404

    data = request.get_json() or {}

    if "title" in data:
        title = data["title"].strip()

        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400

        rehearsal.title = title

    if "description" in data:
        rehearsal.description = data["description"]

    if "rehearsal_date" in data:
        try:
            rehearsal.rehearsal_date = datetime.strptime(
                data["rehearsal_date"],
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({"error": "Invalid rehearsal date"}), 400

    if "start_time" in data:
        if data["start_time"]:
            try:
                rehearsal.start_time = datetime.strptime(
                    data["start_time"],
                    "%H:%M"
                ).time()
            except ValueError:
                return jsonify({"error": "Invalid start time"}), 400
        else:
            rehearsal.start_time = None

    if "end_time" in data:
        if data["end_time"]:
            try:
                rehearsal.end_time = datetime.strptime(
                    data["end_time"],
                    "%H:%M"
                ).time()
            except ValueError:
                return jsonify({"error": "Invalid end time"}), 400
        else:
            rehearsal.end_time = None

    if "location" in data:
        rehearsal.location = data["location"]

    db.session.commit()

    return jsonify({
        "message": "Rehearsal updated successfully"
    }), 200


@rehearsals_bp.route("/<int:rehearsal_id>", methods=["DELETE"])
@permission_required("rehearsals.manage")
def delete_rehearsal(rehearsal_id):
    rehearsal = Rehearsal.query.get(rehearsal_id)

    if not rehearsal:
        return jsonify({"error": "Rehearsal not found"}), 404

    db.session.delete(rehearsal)
    db.session.commit()

    return jsonify({
        "message": "Rehearsal deleted successfully"
    }), 200

