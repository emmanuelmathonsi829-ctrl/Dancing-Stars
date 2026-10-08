
from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from app.models import User, Rehearsal, Attendance, Dance
from app.utils.permissions import permission_required

dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)

@dashboard_bp.route("/overview", methods=["GET"])
@permission_required("dancers.view")
def get_overview():
    today = datetime.utcnow().date()

    active_dancers = User.query.filter_by(
        account_type="DANCER",
        status="ACTIVE"
    ).count()

    upcoming_rehearsals = Rehearsal.query.filter(
        Rehearsal.rehearsal_date >= today
    ).count()

    dance_count = Dance.query.count()

    latest_rehearsal = Rehearsal.query.filter(
        Rehearsal.rehearsal_date <= today
    ).order_by(
        Rehearsal.rehearsal_date.desc(),
        Rehearsal.start_time.desc()
    ).first()

    attendance_rate = None

    if latest_rehearsal and active_dancers > 0:
        present_count = Attendance.query.filter_by(
            rehearsal_id=latest_rehearsal.id,
            status="PRESENT"
        ).count()

        attendance_rate = round(
            (present_count / active_dancers) * 100
        )

    next_rehearsal = Rehearsal.query.filter(
        Rehearsal.rehearsal_date >= today
    ).order_by(
        Rehearsal.rehearsal_date.asc(),
        Rehearsal.start_time.asc()
    ).first()

    return jsonify({
        "dancers": active_dancers,
        "upcoming_rehearsals": upcoming_rehearsals,
        "attendance_rate": attendance_rate,
        "dances": dance_count,
        "next_rehearsal": {
            "id": next_rehearsal.id,
            "title": next_rehearsal.title,
            "date": next_rehearsal.rehearsal_date.isoformat(),
            "start_time": next_rehearsal.start_time.isoformat()
            if next_rehearsal.start_time else None,
            "end_time": next_rehearsal.end_time.isoformat()
            if next_rehearsal.end_time else None,
            "location": next_rehearsal.location
        } if next_rehearsal else None
    }), 200

