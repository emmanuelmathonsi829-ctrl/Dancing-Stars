
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User, Rehearsal, Attendance
from app.utils.permissions import permission_required


attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/attendance"
)


@attendance_bp.route("/rehearsals", methods=["GET"])
@permission_required("attendance.view")
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

    return jsonify({
        "rehearsals": result
    }), 200


@attendance_bp.route("/rehearsals/<int:rehearsal_id>", methods=["GET"])
@permission_required("attendance.view")
def get_attendance(rehearsal_id):

    rehearsal = Rehearsal.query.get(rehearsal_id)

    if not rehearsal:
        return jsonify({
            "error": "Rehearsal not found"
        }), 404

    dancers = User.query.filter(
        User.status == "ACTIVE",
        db.or_(
            User.account_type == "DANCER",
            db.and_(
                User.account_type == "SHEPHERD",
                User.username.ilike("shepherd")
            )
        )
    ).order_by(
        User.username.asc()
    ).all()

    records = Attendance.query.filter_by(
        rehearsal_id=rehearsal_id
    ).all()

    record_map = {
        record.dancer_id: record
        for record in records
    }

    result = []

    for dancer in dancers:

        record = record_map.get(dancer.id)

        result.append({
            "dancer_id": dancer.id,
            "username": dancer.username,
            "status": record.status if record else "ABSENT",
            "marked_at": record.marked_at.isoformat()
            if record and record.marked_at else None,
            "marked_by": record.marker.username
            if record and record.marker else None
        })

    return jsonify({
        "rehearsal": {
            "id": rehearsal.id,
            "title": rehearsal.title,
            "rehearsal_date": rehearsal.rehearsal_date.isoformat(),
            "start_time": rehearsal.start_time.isoformat()
            if rehearsal.start_time else None,
            "end_time": rehearsal.end_time.isoformat()
            if rehearsal.end_time else None,
            "location": rehearsal.location
        },
        "attendance": result
    }), 200


@attendance_bp.route(
    "/rehearsals/<int:rehearsal_id>/dancers/<int:dancer_id>",
    methods=["PATCH"]
)
@permission_required("attendance.take")
def mark_attendance(rehearsal_id, dancer_id):

    rehearsal = Rehearsal.query.get(rehearsal_id)

    if not rehearsal:
        return jsonify({
            "error": "Rehearsal not found"
        }), 404

    dancer = User.query.filter_by(
        id=dancer_id,
        account_type="DANCER"
    ).first()

    if not dancer:
        return jsonify({
            "error": "Dancer not found"
        }), 404

    if dancer.status != "ACTIVE":
        return jsonify({
            "error": "Dancer account is disabled"
        }), 403

    data = request.get_json() or {}

    status = data.get("status")

    if status not in ["PRESENT", "ABSENT"]:
        return jsonify({
            "error": "Status must be PRESENT or ABSENT"
        }), 400

    user_id = get_jwt_identity()

    record = Attendance.query.filter_by(
        rehearsal_id=rehearsal_id,
        dancer_id=dancer_id
    ).first()

    if record:

        record.status = status
        record.marked_at = datetime.utcnow()
        record.marked_by = user_id

    else:

        record = Attendance(
            rehearsal_id=rehearsal_id,
            dancer_id=dancer_id,
            status=status,
            marked_at=datetime.utcnow(),
            marked_by=user_id
        )

        db.session.add(record)

    db.session.commit()

    return jsonify({
        "message": "Attendance updated successfully",
        "attendance": {
            "rehearsal_id": rehearsal_id,
            "dancer_id": dancer_id,
            "status": status,
            "marked_by": user_id
        }
    }), 200

