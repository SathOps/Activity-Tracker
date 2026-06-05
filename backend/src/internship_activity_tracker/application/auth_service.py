from __future__ import annotations

import os
import secrets
from typing import Any
from urllib.parse import urlencode

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from internship_activity_tracker.application.exceptions import AppError, ConflictError, NotFoundError, UnauthorizedError
from internship_activity_tracker.application.serializers import user_to_dict
from internship_activity_tracker.domain.auth import corpus_service
from internship_activity_tracker.infrastructure.gitlab.network import get_user_from_token
from internship_activity_tracker.infrastructure.models import User

DEFAULT_GITLAB_URL = os.getenv("GITLAB_URL", "https://code.swecha.org").rstrip("/")


def _corpus_is_admin(me: dict[str, Any]) -> bool:
    roles = me.get("roles") or []
    if isinstance(roles, str):
        roles = [roles]
    for role in roles:
        if isinstance(role, dict):
            candidate = str(role.get("name") or role.get("role") or "").lower()
        else:
            candidate = str(role).lower()
        if candidate == "admin":
            return True
    return False


def sync_user_from_corpus(session: Session, me: dict[str, Any]) -> User:
    username = str(me.get("username") or "").strip()
    if not username:
        raise UnauthorizedError("Corpus profile did not include a username.")

    user = session.scalar(select(User).where(User.corpus_username == username))
    should_promote_admin = _corpus_is_admin(me)
    full_name = str(me.get("full_name") or me.get("name") or username).strip()
    email = str(me.get("email") or "").strip() or None
    institution_id = str(me.get("institution_id") or "").strip() or None
    institution_name = str(me.get("institution_name") or "").strip() or None

    if user is None:
        user = User(
            name=full_name,
            corpus_username=username,
            email=email,
            institution_id=institution_id,
            institution_name=institution_name,
            role="admin" if should_promote_admin else "intern",
        )
        session.add(user)
        session.flush()
        return user

    user.name = full_name
    user.email = email
    user.institution_id = institution_id
    user.institution_name = institution_name
    if should_promote_admin:
        user.role = "admin"
    session.flush()
    return user


def authenticate_corpus(session: Session, phone: str, password: str) -> tuple[dict[str, Any], User]:
    if os.getenv("MOCK_CORPUS", "false").lower() == "true":
        phone_str = str(phone).strip()
        if phone_str.endswith("000"):
            role = "admin"
            username = "mock_admin"
            full_name = "Mock Admin"
        elif phone_str.endswith("999"):
            role = "mentor"
            username = "mock_mentor"
            full_name = "Mock Mentor"
        elif len(phone_str) == 10 and phone_str[-3:].isdigit() and 1 <= int(phone_str[-3:]) <= 999:
            idx = int(phone_str[-3:])
            db_user = session.scalar(select(User).order_by(User.id).offset(idx - 1).limit(1))
            if db_user:
                role = db_user.role
                username = db_user.corpus_username
                full_name = db_user.name
            else:
                role = "intern"
                username = f"mock_intern_{idx}"
                full_name = f"Mock Intern {idx}"
        else:
            role = "intern"
            username = "mock_intern"
            full_name = "Mock Intern"

        db_user = session.scalar(select(User).where(User.corpus_username == username))
        if db_user is None:
            db_user = User(
                name=full_name,
                corpus_username=username,
                role=role,
            )
            session.add(db_user)
            session.flush()
        else:
            db_user.role = role
            db_user.name = full_name
            session.flush()

        payload = {
            "access_token": f"mock_token_{username}",
            "token_type": "bearer",
            "user_id": str(db_user.id),
        }
        return payload, db_user

    payload = corpus_service.authenticate(phone, password)
    token = str(payload["access_token"])
    profile = corpus_service.fetch_profile(token)
    user = sync_user_from_corpus(session, profile)
    return payload, user


def oauth_config() -> dict[str, str]:
    client_id = os.getenv("GITLAB_OAUTH_CLIENT_ID", "").strip()
    client_secret = os.getenv("GITLAB_OAUTH_CLIENT_SECRET", "").strip()
    redirect_uri = os.getenv("GITLAB_OAUTH_REDIRECT_URI", "").strip()
    if not client_id or not client_secret or not redirect_uri:
        raise AppError(
            "GitLab OAuth app is not configured. Set GITLAB_OAUTH_CLIENT_ID, GITLAB_OAUTH_CLIENT_SECRET, and GITLAB_OAUTH_REDIRECT_URI.",
            status_code=500,
        )
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }


def build_gitlab_authorize_url(state: str | None = None) -> tuple[str, str]:
    config = oauth_config()
    final_state = state or secrets.token_urlsafe(24)
    query = urlencode(
        {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "scope": "api",
            "state": final_state,
        }
    )
    return f"{DEFAULT_GITLAB_URL}/oauth/authorize?{query}", final_state


def exchange_gitlab_code(code: str) -> dict[str, Any]:
    config = oauth_config()
    try:
        response = requests.post(
            f"{DEFAULT_GITLAB_URL}/oauth/token",
            data={
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": config["redirect_uri"],
            },
            timeout=20,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise UnauthorizedError(f"GitLab OAuth token exchange failed: {exc}") from exc

    payload: dict[str, Any] = response.json()
    if not payload.get("access_token"):
        raise UnauthorizedError("GitLab OAuth token exchange did not return an access token.")
    return payload


def validate_gitlab_access_token(base_url: str, token: str, *, is_oauth: bool) -> dict[str, Any]:
    try:
        user = get_user_from_token(base_url, token, is_oauth=is_oauth)
    except Exception as exc:
        raise UnauthorizedError(f"GitLab authentication failed: {exc}") from exc
    if not isinstance(user, dict):
        raise UnauthorizedError("GitLab authentication failed.")
    return user


def update_gitlab_username_from_session(session: Session, current_user: User, gitlab_user: dict[str, Any]) -> User:
    username = str(gitlab_user.get("username") or "").strip()
    if not username:
        raise ConflictError("GitLab profile did not include a username.")

    existing = session.scalar(select(User).where(User.gitlab_username == username, User.id != current_user.id))
    if existing is not None:
        raise ConflictError("That GitLab username is already linked to another user.")

    current_user.gitlab_username = username
    session.flush()
    return current_user


def gitlab_status_payload(current_user: User | None, gitlab_url: str, gitlab_user: dict[str, Any], connected: bool) -> dict[str, Any]:
    payload = {
        "status": "ok" if connected else "disconnected",
        "connected": connected,
        "gitlab_url": gitlab_url,
        "user": gitlab_user if connected else None,
    }
    if current_user is not None:
        payload["profile"] = user_to_dict(current_user)
    return payload
