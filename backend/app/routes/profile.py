from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from io import BytesIO
from PIL import Image

from app.extensions import db
from app.models import User

profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/api/profile"
)

MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return None

    if user.status != "ACTIVE":
        return None

    return user


@profile_bp.route("/picture", methods=["POST"])
@jwt_required()
def upload_profile_picture():
    user = get_current_user()

    if not user:
        return jsonify({
            "error": "Account not found or disabled"
        }), 403

    original_file = request.files.get("original")
    cropped_file = request.files.get("cropped")

    if not original_file or not cropped_file:
        return jsonify({
            "error": "Both original and cropped images are required"
        }), 400

    original_data = original_file.read()
    cropped_data = cropped_file.read()

    if not original_data or not cropped_data:
        return jsonify({
            "error": "Images cannot be empty"
        }), 400

    if len(original_data) > MAX_IMAGE_SIZE:
        return jsonify({
            "error": "Original image is too large. Maximum size is 5 MB"
        }), 400

    if len(cropped_data) > MAX_IMAGE_SIZE:
        return jsonify({
            "error": "Cropped image is too large. Maximum size is 5 MB"
        }), 400

    try:
        original_image = Image.open(BytesIO(original_data))
        cropped_image = Image.open(BytesIO(cropped_data))

        original_image.verify()
        cropped_image.verify()
    except Exception:
        return jsonify({
            "error": "Invalid image"
        }), 400

    try:
        original_image = Image.open(BytesIO(original_data))
        cropped_image = Image.open(BytesIO(cropped_data))

        if original_image.format not in ALLOWED_FORMATS:
            return jsonify({
                "error": "Unsupported original image format"
            }), 400

        if cropped_image.format not in ALLOWED_FORMATS:
            return jsonify({
                "error": "Unsupported cropped image format"
            }), 400
    except Exception:
        return jsonify({
            "error": "Unable to read image"
        }), 400

    user.profile_picture_original = original_data
    user.profile_picture = cropped_data

    db.session.commit()

    return jsonify({
        "message": "Profile picture updated successfully"
    }), 200


@profile_bp.route("/picture", methods=["GET"])
@jwt_required()
def get_my_profile_picture():
    user = get_current_user()

    if not user:
        return jsonify({
            "error": "Account not found or disabled"
        }), 403

    if not user.profile_picture:
        return jsonify({
            "error": "No profile picture"
        }), 404

    return send_file(
        BytesIO(user.profile_picture),
        mimetype="image/jpeg"
    )


@profile_bp.route("/picture/<int:user_id>", methods=["GET"])
@jwt_required()
def get_profile_picture(user_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({
            "error": "Account not found or disabled"
        }), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.status != "ACTIVE":
        return jsonify({
            "error": "Profile picture unavailable"
        }), 404

    if not user.profile_picture:
        return jsonify({
            "error": "No profile picture"
        }), 404

    return send_file(
        BytesIO(user.profile_picture),
        mimetype="image/jpeg"
    )

from datetime import date


@profile_bp.route("/birthday", methods=["PUT"])
@jwt_required()
def save_birthday():
    user = get_current_user()

    if not user:
        return jsonify({
            "error": "Account not found or disabled"
        }), 403

    data = request.get_json(silent=True) or {}

    try:
        day = int(data.get("day"))
        month = int(data.get("month"))
        date(2000, month, day)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Please provide a valid birthday day and month"
        }), 400

    user.birthday_day = day
    user.birthday_month = month

    db.session.commit()

    return jsonify({
        "message": "Birthday saved successfully",
        "birthday_day": user.birthday_day,
        "birthday_month": user.birthday_month
    }), 200


@profile_bp.route("/birthdays", methods=["GET"])
@jwt_required()
def get_birthdays():
    from datetime import date

    current_user = get_current_user()

    if not current_user:
        return jsonify({
            "error": "Account not found or disabled"
        }), 403

    today = date.today()
    users = User.query.filter(
        User.status == "ACTIVE",
        User.birthday_day.isnot(None),
        User.birthday_month.isnot(None)
    ).all()

    birthdays = []

    for user in users:
        try:
            birthday_this_year = date(
                today.year,
                user.birthday_month,
                user.birthday_day
            )
        except ValueError:
            continue

        days_until = (birthday_this_year - today).days

        if days_until < 0:
            days_until += 366 if date(today.year, 12, 31).timetuple().tm_yday == 366 else 365

        birthdays.append({
            "id": user.id,
            "username": user.username,
            "birthday_day": user.birthday_day,
            "birthday_month": user.birthday_month,
            "days_until": days_until,
            "has_profile_picture": user.profile_picture is not None
        })

    birthdays.sort(key=lambda birthday: birthday["days_until"])

    return jsonify({
        "birthdays": birthdays
    }), 200

