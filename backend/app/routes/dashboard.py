from datetime import datetime, timedelta

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_, and_

from app.models import User, Rehearsal, Attendance, Dance

dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)

@dashboard_bp.route("/overview", methods=["GET"])
@jwt_required()
def get_overview():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.status != "ACTIVE":
        return jsonify({"error": "Account is disabled"}), 403

    current_datetime = datetime.utcnow() + timedelta(hours=2)
    today = current_datetime.date()
    current_time = current_datetime.time()

    upcoming_filter = or_(
        Rehearsal.rehearsal_date > today,
        and_(
            Rehearsal.rehearsal_date == today,
            Rehearsal.end_time.isnot(None),
            Rehearsal.end_time > current_time
        ),
        and_(
            Rehearsal.rehearsal_date == today,
            Rehearsal.end_time.is_(None),
            Rehearsal.start_time.isnot(None),
            Rehearsal.start_time > current_time
        )
    )

    completed_filter = or_(
        Rehearsal.rehearsal_date < today,
        and_(
            Rehearsal.rehearsal_date == today,
            Rehearsal.end_time.isnot(None),
            Rehearsal.end_time <= current_time
        )
    )

    if user.account_type == "DANCER":
        upcoming_rehearsals = Rehearsal.query.filter(
            upcoming_filter
        ).order_by(
            Rehearsal.rehearsal_date.asc(),
            Rehearsal.start_time.asc()
        ).limit(5).all()

        attendance_records = Attendance.query.filter_by(
            dancer_id=user.id
        ).join(
            Rehearsal,
            Attendance.rehearsal_id == Rehearsal.id
        ).filter(
            completed_filter
        ).order_by(
            Rehearsal.rehearsal_date.desc(),
            Rehearsal.start_time.desc()
        ).all()

        total_recorded = len(attendance_records)

        total_attended = sum(
            1
            for attendance in attendance_records
            if attendance.status == "PRESENT"
        )

        attendance_rate = None

        if total_recorded > 0:
            attendance_rate = round(
                (total_attended / total_recorded) * 100
            )

        current_streak = 0

        for attendance in attendance_records:
            if attendance.status == "PRESENT":
                current_streak += 1
            else:
                break

        next_rehearsal = (
            upcoming_rehearsals[0]
            if upcoming_rehearsals
            else None
        )

        return jsonify({
            "account_type": "DANCER",
            "attendance": {
                "rate": attendance_rate,
                "total_attended": total_attended,
                "total_recorded": total_recorded,
                "current_streak": current_streak
            },
            "upcoming_rehearsals": [
                {
                    "id": rehearsal.id,
                    "title": rehearsal.title,
                    "date": rehearsal.rehearsal_date.isoformat(),
                    "start_time": (
                        rehearsal.start_time.isoformat()
                        if rehearsal.start_time
                        else None
                    ),
                    "end_time": (
                        rehearsal.end_time.isoformat()
                        if rehearsal.end_time
                        else None
                    ),
                    "location": rehearsal.location
                }
                for rehearsal in upcoming_rehearsals
            ],
            "next_rehearsal": {
                "id": next_rehearsal.id,
                "title": next_rehearsal.title,
                "date": next_rehearsal.rehearsal_date.isoformat(),
                "start_time": (
                    next_rehearsal.start_time.isoformat()
                    if next_rehearsal.start_time
                    else None
                ),
                "end_time": (
                    next_rehearsal.end_time.isoformat()
                    if next_rehearsal.end_time
                    else None
                ),
                "location": next_rehearsal.location
            } if next_rehearsal else None
        }), 200

    active_dancers = User.query.filter(
        User.account_type.in_(["DANCER", "SHEPHERD"]),
        User.status == "ACTIVE"
    ).count()

    upcoming_rehearsals = Rehearsal.query.filter(
        upcoming_filter
    ).count()

    dance_count = Dance.query.count()

    latest_rehearsal = Rehearsal.query.filter(
        completed_filter
    ).order_by(
        Rehearsal.rehearsal_date.desc(),
        Rehearsal.end_time.desc()
    ).first()

    attendees = 0
    attendance_rate = None

    if latest_rehearsal:
        attendees = Attendance.query.filter_by(
            rehearsal_id=latest_rehearsal.id,
            status="PRESENT"
        ).count()

        if active_dancers > 0:
            attendance_rate = round(
                (attendees / active_dancers) * 100
            )

    next_rehearsal = Rehearsal.query.filter(
        upcoming_filter
    ).order_by(
        Rehearsal.rehearsal_date.asc(),
        Rehearsal.start_time.asc()
    ).first()

    return jsonify({
        "account_type": user.account_type,
        "members": active_dancers,
        "attendees": attendees,
        "attendance_rate": attendance_rate,
        "upcoming_rehearsals": upcoming_rehearsals,
        "dances": dance_count,
        "latest_rehearsal": {
            "id": latest_rehearsal.id,
            "title": latest_rehearsal.title,
            "date": latest_rehearsal.rehearsal_date.isoformat()
        } if latest_rehearsal else None,
        "next_rehearsal": {
            "id": next_rehearsal.id,
            "title": next_rehearsal.title,
            "date": next_rehearsal.rehearsal_date.isoformat(),
            "start_time": (
                next_rehearsal.start_time.isoformat()
                if next_rehearsal.start_time
                else None
            ),
            "end_time": (
                next_rehearsal.end_time.isoformat()
                if next_rehearsal.end_time
                else None
            ),
            "location": next_rehearsal.location
        } if next_rehearsal else None
    }), 200