from __future__ import annotations

import os
from typing import Generator

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.session_store import SessionData, get_session
from internship_activity_tracker.application.auth_service import (
    DEFAULT_GITLAB_URL,
    sync_user_from_corpus,
    validate_gitlab_access_token,
)
from internship_activity_tracker.application.exceptions import AppError, UnauthorizedError
from internship_activity_tracker.application.user_service import get_user_by_corpus_username
from internship_activity_tracker.domain.auth.corpus_service import fetch_profile
from internship_activity_tracker.infrastructure.database import get_session as get_db_session
from internship_activity_tracker.infrastructure.gitlab.client import GitLabClient
from internship_activity_tracker.infrastructure.models import User


def get_db() -> Generator[Session, None, None]:
    with get_db_session() as session:
        yield session


def _get_user_from_session(db: Session, browser_session: SessionData | None) -> User | None:
    if browser_session is None or not browser_session.corpus_username:
        return None
    return get_user_by_corpus_username(db, browser_session.corpus_username)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    browser_session = get_session(request)
    user = _get_user_from_session(db, browser_session)
    if user is not None:
        return user

    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif browser_session and browser_session.corpus_token:
        token = browser_session.corpus_token

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Corpus login required.")

    try:
        profile = fetch_profile(token)
        user = sync_user_from_corpus(db, profile)
        if browser_session is not None:
            browser_session.corpus_token = token
            browser_session.corpus_username = user.corpus_username
        return user
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def get_corpus_token(request: Request, authorization: str | None = Header(default=None)) -> str:
    browser_session = get_session(request)
    if browser_session and browser_session.corpus_token:
        return browser_session.corpus_token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Corpus token not found.")


def get_gitlab_client(request: Request) -> GitLabClient:
    browser_session = get_session(request)
    if browser_session and browser_session.gitlab_token:
        return GitLabClient(
            browser_session.gitlab_url or DEFAULT_GITLAB_URL,
            browser_session.gitlab_token,
            is_oauth=browser_session.gitlab_auth_type == "oauth",
        )

    fallback_token = os.getenv("GITLAB_TOKEN", "").strip()
    if fallback_token:
        return GitLabClient(DEFAULT_GITLAB_URL, fallback_token)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="GitLab login required.")


def get_gitlab_identity(request: Request) -> dict:
    browser_session = get_session(request)
    if not browser_session or not browser_session.gitlab_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="GitLab login required.")
    try:
        return validate_gitlab_access_token(
            browser_session.gitlab_url or DEFAULT_GITLAB_URL,
            browser_session.gitlab_token,
            is_oauth=browser_session.gitlab_auth_type == "oauth",
        )
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return user


def require_mentor_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"mentor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Mentor or admin access required.")
    return user


def get_mentor_allowed_batch_ids(user: User = Depends(get_current_user)) -> list[int] | None:
    if user.role == "admin":
        return None
    if user.role == "mentor":
        return [assignment.batch_id for assignment in user.mentor_batches]
    return [user.batch_id] if user.batch_id else []


def get_allowed_gitlab_usernames(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[str] | None:
    if user.role == "admin":
        return None
    from sqlalchemy import select
    from internship_activity_tracker.infrastructure.models import User as DbUser

    if user.role == "mentor":
        batch_ids = [assignment.batch_id for assignment in user.mentor_batches]
        rows = db.scalars(select(DbUser).where(DbUser.batch_id.in_(batch_ids))).all() if batch_ids else []
        return [row.gitlab_username for row in rows if row.gitlab_username]
    if user.gitlab_username:
        return [user.gitlab_username]
    return []
