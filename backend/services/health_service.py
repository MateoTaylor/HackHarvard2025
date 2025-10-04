from flask import jsonify
from config import active_challenges
from services.cleanup_service import cleanup_expired_challenges
from datetime import datetime

def health_check_service():
    """
    Perform a health check for the service.

    This function cleans up expired challenges, then returns a JSON response
    indicating the service status, current timestamp, and the number of active challenges.

    Returns:
        flask.Response: JSON response containing the service status, timestamp, and active challenges count.

    Notes:
        - Calls `cleanup_expired_challenges` to ensure stale data is removed.
        - Provides a lightweight health check endpoint for monitoring.
    """
    cleanup_expired_challenges()
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "active_challenges": len(active_challenges)
    })
