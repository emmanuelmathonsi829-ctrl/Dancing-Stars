
from io import BytesIO
from datetime import datetime

from flask import Blueprint, request, jsonify, send_file, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import User, Music


music_bp = Blueprint(
    "music",
    __name__,
    url_prefix="/api/music"
)

ALLOWED_EXTENSIONS = {
    "mp3",
    "wav",
    "ogg",
    "m4a",
    "aac",
    "flac"
}

MAX_FILE_SIZE = 25 * 1024 * 1024

MIME_TYPES = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "aac": "audio/aac",
    "flac": "audio/flac"
}


def get_logged_in_user():
    user_id = get_jwt_identity()

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    user = db.session.get(User, user_id)

    if not user or user.status != "ACTIVE":
        return None

    return user


def music_to_dict(music):
    return {
        "id": music.id,
        "title": music.title,
        "artist": music.artist or "Unknown artist",
        "description": music.description or "",
        "uploaded_by": music.uploader.username if music.uploader else "Unknown",
        "created_at": music.created_at.isoformat() if music.created_at else None,
        "play_url": url_for(
            "music.play_music",
            music_id=music.id
        )
    }


@music_bp.route("", methods=["GET"])
@jwt_required()
def get_music():
    user = get_logged_in_user()

    if not user:
        return jsonify({"error": "Active account not found"}), 403

    songs = Music.query.order_by(
        Music.created_at.desc(),
        Music.id.desc()
    ).all()

    return jsonify({
        "music": [music_to_dict(song) for song in songs]
    }), 200


@music_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_music():
    user = get_logged_in_user()

    if not user:
        return jsonify({"error": "Active account not found"}), 403

    title = request.form.get("title", "").strip()
    artist = request.form.get("artist", "").strip()
    description = request.form.get("description", "").strip()
    audio = request.files.get("file")

    if not title:
        return jsonify({"error": "Please enter a song title"}), 400

    if len(title) > 150:
        return jsonify({"error": "Song title is too long"}), 400

    if len(artist) > 150:
        return jsonify({"error": "Artist name is too long"}), 400

    if not audio or not audio.filename:
        return jsonify({"error": "Please select an audio file"}), 400

    filename = secure_filename(audio.filename)

    if "." not in filename:
        return jsonify({"error": "Unsupported audio file"}), 400

    extension = filename.rsplit(".", 1)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "Supported formats: MP3, WAV, OGG, M4A, AAC and FLAC"
        }), 400

    file_data = audio.read(MAX_FILE_SIZE + 1)

    if not file_data:
        return jsonify({"error": "The audio file is empty"}), 400

    if len(file_data) > MAX_FILE_SIZE:
        return jsonify({
            "error": "Audio files must be 25 MB or smaller"
        }), 400


    song = Music(
        title=title,
        artist=artist or None,
        description=description or None,
        file_path=filename,
        file_data=file_data,
        uploaded_by=user.id,
        created_at=datetime.utcnow()
    )



    try:
        db.session.add(song)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Unable to save the song. Please try again."
        }), 500

    return jsonify({
        "message": "Music uploaded successfully",
        "music": music_to_dict(song)
    }), 201


@music_bp.route("/<int:music_id>/play", methods=["GET"])
@jwt_required()
def play_music(music_id):
    user = get_logged_in_user()

    if not user:
        return jsonify({"error": "Active account not found"}), 403

    song = db.session.get(Music, music_id)

    if not song:
        return jsonify({"error": "Song not found"}), 404

    if not song.file_data:
        return jsonify({
            "error": "Audio file is unavailable"
        }), 404

    extension = (
        song.file_path.rsplit(".", 1)[-1].lower()
        if song.file_path and "." in song.file_path
        else "mp3"
    )

    return send_file(
        BytesIO(song.file_data),
        mimetype=MIME_TYPES.get(extension, "application/octet-stream"),
        as_attachment=False,
        download_name=secure_filename(song.title) + "." + extension
    )


@music_bp.route("/<int:music_id>", methods=["DELETE"])
@jwt_required()
def delete_music(music_id):
    user = get_logged_in_user()

    if not user:
        return jsonify({"error": "Active account not found"}), 403

    if user.account_type not in ["SHEPHERD", "ASSISTANT"]:
        return jsonify({
            "error": "Only Shepherds and Assistants can delete music"
        }), 403

    song = db.session.get(Music, music_id)

    if not song:
        return jsonify({"error": "Song not found"}), 404

    try:
        db.session.delete(song)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Unable to delete the song"
        }), 500

    return jsonify({
        "message": "Music deleted successfully"
    }), 200

