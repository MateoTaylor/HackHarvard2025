from datetime import datetime
from config import active_challenges, logger

def cleanup_expired_challenges():
    """
    Remove expired challenges from memory.

    This function iterates through the active challenges and removes any that
    have passed their expiration time. Logs the number of challenges cleaned up.

    Notes:
        - Uses the current system time to determine expiration.
        - Logs the cleanup process if expired challenges are found.
    """
    current_time = datetime.now()
    expired_ids = [
        challenge_id for challenge_id, challenge in active_challenges.items()
        if challenge['expires_at'] < current_time
    ]
    for challenge_id in expired_ids:
        del active_challenges[challenge_id]

    if expired_ids:
        logger.info(f"Cleaned up {len(expired_ids)} expired challenges")
