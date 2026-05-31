from __future__ import annotations

import concurrent.futures as cf
import json
from typing import Generator

from internship_activity_tracker.application import user_service
from internship_activity_tracker.infrastructure.gitlab import batch as batch_engine


def resolve_projects(client, project_paths: list[str]) -> dict:
    resolved, failed = batch_engine.resolve_project_paths(client, project_paths)
    return {"resolved": resolved, "failed": failed}


def _filter_usernames(usernames: list[str], allowed_usernames: list[str] | None) -> list[str]:
    cleaned = [username.strip() for username in usernames if username.strip()]
    if allowed_usernames is None:
        return cleaned
    allowed = set(allowed_usernames)
    return [username for username in cleaned if username in allowed]


def _user_overrides(session, usernames: list[str]) -> dict[str, tuple[str | None, str | None]]:
    overrides: dict[str, tuple[str | None, str | None]] = {}
    for username in usernames:
        user = user_service.get_user_by_username(session, username)
        if not user:
            continue
        override_email = (user.get("global_email") or "").strip() or None
        override_username = (user.get("global_username") or "").strip() or None
        if override_email or override_username:
            overrides[username] = (override_email, override_username)
    return overrides


def profile_stream(
    session,
    client,
    usernames: list[str],
    *,
    allowed_usernames: list[str] | None,
    since: str | None,
    until: str | None,
    project_ids: list[int] | None,
) -> Generator[str, None, None]:
    clean_usernames = _filter_usernames(usernames, allowed_usernames)
    total = len(clean_usernames)
    overrides = _user_overrides(session, clean_usernames)

    futures = {
        batch_engine._GLOBAL_EXECUTOR.submit(
            batch_engine.process_single_user_no_commits,
            client,
            username,
            since,
            until,
            project_ids,
            *overrides.get(username, (None, None)),
        ): username
        for username in clean_usernames
    }

    current = 0
    try:
        for future in cf.as_completed(futures):
            current += 1
            username = futures[future]
            try:
                result = future.result() or {
                    "username": username,
                    "status": "Error",
                    "error": "Empty result returned",
                }
            except Exception as exc:  # pragma: no cover - stream safety
                result = {
                    "username": username,
                    "status": "Crash",
                    "error": str(exc),
                }

            yield f"data: {json.dumps({'type': 'progress', 'current': current, 'total': total, 'username': username, 'result': result})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'total_processed': total})}\n\n"
    except Exception as exc:  # pragma: no cover - stream safety
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"


def commits_stream(
    session,
    client,
    usernames: list[str],
    *,
    allowed_usernames: list[str] | None,
    since: str | None,
    until: str | None,
    project_ids: list[int] | None,
) -> Generator[str, None, None]:
    clean_usernames = _filter_usernames(usernames, allowed_usernames)
    total = len(clean_usernames)
    overrides = _user_overrides(session, clean_usernames)

    futures = {
        batch_engine._GLOBAL_EXECUTOR.submit(
            batch_engine.fetch_user_commits_only,
            client,
            username,
            since,
            until,
            project_ids,
            *overrides.get(username, (None, None)),
        ): username
        for username in clean_usernames
    }

    current = 0
    try:
        for future in cf.as_completed(futures):
            current += 1
            username = futures[future]
            try:
                result = future.result() or {
                    "username": username,
                    "status": "Error",
                    "error": "Empty result",
                    "commits": [],
                    "commit_stats": {},
                }
            except Exception as exc:  # pragma: no cover - stream safety
                result = {
                    "username": username,
                    "status": "Crash",
                    "error": str(exc),
                    "commits": [],
                    "commit_stats": {},
                }

            yield f"data: {json.dumps({'type': 'progress', 'current': current, 'total': total, 'username': username, 'result': result})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'total_processed': total})}\n\n"
    except Exception as exc:  # pragma: no cover - stream safety
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"


def _stream_with_phase(stream: Generator[str, None, None], phase: str, *, include_done: bool) -> Generator[str, None, None]:
    for chunk in stream:
        if not chunk.startswith("data:"):
            yield chunk
            continue
        raw = chunk[len("data:") :].strip()
        if not raw:
            continue
        payload = json.loads(raw)
        if payload.get("type") == "done" and not include_done:
            continue
        if payload.get("type") == "progress":
            payload["phase"] = phase
        yield f"data: {json.dumps(payload)}\n\n"


def combined_stream(
    session,
    client,
    usernames: list[str],
    *,
    allowed_usernames: list[str] | None,
    since: str | None,
    until: str | None,
    project_ids: list[int] | None,
) -> Generator[str, None, None]:
    yield from _stream_with_phase(
        profile_stream(
            session,
            client,
            usernames,
            allowed_usernames=allowed_usernames,
            since=since,
            until=until,
            project_ids=project_ids,
        ),
        "profile",
        include_done=False,
    )
    yield from _stream_with_phase(
        commits_stream(
            session,
            client,
            usernames,
            allowed_usernames=allowed_usernames,
            since=since,
            until=until,
            project_ids=project_ids,
        ),
        "commits",
        include_done=True,
    )
