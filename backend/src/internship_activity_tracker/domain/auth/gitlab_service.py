"""GitLab authentication helpers."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from internship_activity_tracker.infrastructure.gitlab.network import get_user_from_token


def validate_token(base_url: str, token: str) -> dict[str, Any]:
    """Validate a GitLab PAT and return the user payload."""
    try:
        user = get_user_from_token(base_url, token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {exc}",
        ) from exc

    if not isinstance(user, dict):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(user))

    return user
