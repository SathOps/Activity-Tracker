"""Server-side browser session storage for integration auth."""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass, field
from typing import Any

from fastapi import Request, Response

SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "iat_session")
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "lax")


@dataclass
class SessionData:
    corpus_token: str = ""
    corpus_username: str = ""
    gitlab_token: str = ""
    gitlab_url: str = ""
    gitlab_user: dict[str, Any] = field(default_factory=dict)
    gitlab_auth_type: str = ""
    gitlab_oauth_state: str = ""
    gitlab_error: str = ""


_SESSIONS: dict[str, SessionData] = {}


def get_session_id(request: Request) -> str:
    return request.cookies.get(SESSION_COOKIE_NAME, "")


def get_session(request: Request) -> SessionData | None:
    sid = get_session_id(request)
    return _SESSIONS.get(sid) if sid else None


def ensure_session(request: Request, response: Response) -> SessionData:
    sid = get_session_id(request)
    session = _SESSIONS.get(sid) if sid else None
    if session is not None:
        return session

    sid = secrets.token_urlsafe(32)
    session = SessionData()
    _SESSIONS[sid] = session
    response.set_cookie(
        SESSION_COOKIE_NAME,
        sid,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,  # type: ignore[arg-type]
        path="/",
    )
    return session


def clear_session(request: Request, response: Response) -> None:
    sid = get_session_id(request)
    if sid:
        _SESSIONS.pop(sid, None)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
