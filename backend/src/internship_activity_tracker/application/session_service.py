from __future__ import annotations

from internship_activity_tracker.application.serializers import user_to_dict


def get_session_state(current_user, *, gitlab_connected: bool) -> dict:
    user = user_to_dict(current_user)
    return {
        "authenticated": True,
        "gitlab_connected": gitlab_connected,
        "needs_profile_setup": not bool((user.get("gitlab_username") or "").strip()),
        "needs_batch_selection": user.get("batch_id") is None,
        "user": user,
    }
