from flask import Blueprint, jsonify
from app.utils.permissions import permission_required


dance_bp = Blueprint(
    "dance",
    __name__,
    url_prefix="/api/dances"
)


@dance_bp.route("", methods=["GET"])
@permission_required("dance.view")
def get_dances():
    return jsonify({
        "message": "You have permission to view dances."
    }), 200