from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.auth import CorpusLoginRequest, CorpusLoginResponse, SessionResponse
from app.schemas.roster import UserRecord
from app.schemas.compliance import GitlabStatusResponse
from app.session_store import clear_session, ensure_session, get_session
from internship_activity_tracker.application.auth_service import (
    DEFAULT_GITLAB_URL,
    authenticate_corpus,
    build_gitlab_authorize_url,
    exchange_gitlab_code,
    gitlab_status_payload,
    update_gitlab_username_from_session,
    validate_gitlab_access_token,
)
from internship_activity_tracker.application import session_service, user_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Auth"])


@router.post("/corpus/login", response_model=CorpusLoginResponse)
def corpus_login(body: CorpusLoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    payload, user = authenticate_corpus(db, body.phone, body.password)
    browser_session = ensure_session(request, response)
    browser_session.corpus_token = payload["access_token"]
    browser_session.corpus_username = user.corpus_username
    return CorpusLoginResponse(
        access_token=payload["access_token"],
        token_type=payload.get("token_type") or "bearer",
        user_id=str(payload.get("user_id") or user.id),
        username=user.corpus_username,
        phone=body.phone,
        roles=[user.role],
        profile={
            "corpus_username": user.corpus_username,
            "name": user.name,
            "email": user.email or "",
            "institution_id": user.institution_id or "",
            "institution_name": user.institution_name or "",
        },
    )


@router.post("/corpus/logout")
def corpus_logout(request: Request, response: Response):
    clear_session(request, response)
    return {"status": "ok"}


@router.get("/session", response_model=SessionResponse)
def get_session_state(request: Request, db: Session = Depends(get_db)):
    browser_session = get_session(request)
    if browser_session is None or not browser_session.corpus_username:
        return SessionResponse()
    current_user = user_service.get_user_by_corpus_username(db, browser_session.corpus_username)
    if current_user is None:
        return SessionResponse()
    gitlab_connected = False
    if browser_session and browser_session.gitlab_token:
        try:
            gitlab_user = validate_gitlab_access_token(
                browser_session.gitlab_url or DEFAULT_GITLAB_URL,
                browser_session.gitlab_token,
                is_oauth=browser_session.gitlab_auth_type == "oauth",
            )
            browser_session.gitlab_user = gitlab_user
            update_gitlab_username_from_session(db, current_user, gitlab_user)
            gitlab_connected = True
        except HTTPException:
            gitlab_connected = False
    payload = session_service.get_session_state(current_user, gitlab_connected=gitlab_connected)
    if payload["user"] is not None:
        payload["user"] = UserRecord(**payload["user"])
    return SessionResponse(**payload)


@router.get("/gitlab/login")
def gitlab_login(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    browser_session = ensure_session(request, response)
    url, state = build_gitlab_authorize_url()
    browser_session.gitlab_oauth_state = state
    browser_session.gitlab_error = ""
    return RedirectResponse(url)


@router.get("/gitlab/callback")
def gitlab_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    browser_session = ensure_session(request, response)
    if not browser_session.gitlab_oauth_state or browser_session.gitlab_oauth_state != state:
        raise HTTPException(status_code=400, detail="Invalid GitLab OAuth state.")
    token_payload = exchange_gitlab_code(code)
    access_token = str(token_payload["access_token"])
    gitlab_user = validate_gitlab_access_token(DEFAULT_GITLAB_URL, access_token, is_oauth=True)
    browser_session.gitlab_token = access_token
    browser_session.gitlab_url = DEFAULT_GITLAB_URL
    browser_session.gitlab_auth_type = "oauth"
    browser_session.gitlab_oauth_state = ""
    browser_session.gitlab_user = gitlab_user
    browser_session.gitlab_error = ""
    update_gitlab_username_from_session(db, current_user, gitlab_user)
    frontend_url = os.getenv("FRONTEND_APP_URL", "http://localhost:5173").rstrip("/")
    return RedirectResponse(f"{frontend_url}/compliance/profile")


@router.get("/gitlab/status", response_model=GitlabStatusResponse)
def gitlab_status(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    browser_session = get_session(request)
    if not browser_session or not browser_session.gitlab_token:
        return GitlabStatusResponse(
            **gitlab_status_payload(current_user, DEFAULT_GITLAB_URL, {}, False)
        )
    gitlab_user = validate_gitlab_access_token(
        browser_session.gitlab_url or DEFAULT_GITLAB_URL,
        browser_session.gitlab_token,
        is_oauth=browser_session.gitlab_auth_type == "oauth",
    )
    update_gitlab_username_from_session(db, current_user, gitlab_user)
    browser_session.gitlab_user = gitlab_user
    return GitlabStatusResponse(
        **gitlab_status_payload(
            current_user,
            browser_session.gitlab_url or DEFAULT_GITLAB_URL,
            gitlab_user,
            True,
        )
    )



