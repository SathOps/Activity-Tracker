"""Corpus authentication and profile synchronization helpers."""

from __future__ import annotations

from typing import Any

import requests
from fastapi import HTTPException, status

CORPUS_BASE_URL = "https://api.corpus.swecha.org"


def authenticate(phone: str, password: str) -> dict[str, Any]:
    """Authenticate against Corpus and return the raw response payload."""
    try:
        response = requests.post(
            f"{CORPUS_BASE_URL}/api/v1/auth/login",
            json={"phone": phone, "password": password},
            timeout=15,
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 502
        detail = "Invalid phone or password."
        try:
            detail = exc.response.json().get("detail", detail)
        except Exception:
            pass
        raise HTTPException(status_code=status_code, detail=detail) from exc
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach Corpus API: {exc}",
        ) from exc

    payload: dict[str, Any] = response.json()
    if not payload.get("access_token"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Corpus login succeeded but no access_token was returned.",
        )

    return payload


def fetch_profile(token: str) -> dict[str, Any]:
    """Fetch `/auth/me` and enrich institution name when possible."""
    try:
        response = requests.get(
            f"{CORPUS_BASE_URL}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Corpus token.",
        ) from exc
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach Corpus API: {exc}",
        ) from exc

    me: dict[str, Any] = response.json()
    institution_id = str(me.get("institution_id") or "")
    if institution_id:
        try:
            inst_response = requests.get(
                f"{CORPUS_BASE_URL}/api/v1/institutions/{institution_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            inst_response.raise_for_status()
            inst_data = inst_response.json()
            me["institution_name"] = inst_data.get("college_name") or inst_data.get("university_name") or ""
        except Exception:
            pass

    if not me.get("username"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Corpus /me did not return a username.",
        )

    return me


def sync_user(me: dict[str, Any]) -> dict[str, Any]:
    """Create or update the local user row from Corpus profile data."""
    from internship_activity_tracker.services.roster_service import (
        create_or_update_user_from_corpus,
    )

    return create_or_update_user_from_corpus(me)
