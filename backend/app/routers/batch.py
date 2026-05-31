from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies import (
    get_allowed_gitlab_usernames,
    get_current_user,
    get_db,
    get_gitlab_client,
    require_mentor_or_admin,
)
from app.schemas.batch import ResolveProjectsRequest, ResolveProjectsResponse
from internship_activity_tracker.application import batch_analytics_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Batch Analytics"])


@router.post("/resolve-projects", response_model=ResolveProjectsResponse)
def resolve_projects(body: ResolveProjectsRequest, client=Depends(get_gitlab_client)) -> ResolveProjectsResponse:
    try:
        return ResolveProjectsResponse(**batch_analytics_service.resolve_projects(client, body.project_paths))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitLab API error: {exc}",
        ) from exc


@router.get("/stream", response_class=StreamingResponse)
def stream_batch_analytics(
    usernames: str = Query(..., description="Comma-separated list of GitLab usernames."),
    project_ids: Optional[str] = Query(default=None, description="Optional comma-separated numeric project IDs to filter results."),
    since: Optional[str] = Query(default=None, description="ISO 8601 start date filter."),
    until: Optional[str] = Query(default=None, description="ISO 8601 end date filter."),
    mode: str = Query(default="combined", description="Stream mode: combined, profile, or commits."),
    db: Session = Depends(get_db),
    client=Depends(get_gitlab_client),
    current_user: User = Depends(require_mentor_or_admin),
    allowed_usernames: list[str] | None = Depends(get_allowed_gitlab_usernames),
):
    clean_usernames = [username.strip() for username in usernames.split(",") if username.strip()]
    if not clean_usernames:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one username must be provided.",
        )

    pid_list: Optional[list[int]] = None
    if project_ids:
        try:
            pid_list = [int(item.strip()) for item in project_ids.split(",") if item.strip()]
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="project_ids must be comma-separated integers.",
            ) from exc

    stream_factory = {
        "combined": batch_analytics_service.combined_stream,
        "profile": batch_analytics_service.profile_stream,
        "commits": batch_analytics_service.commits_stream,
    }.get(mode)
    if stream_factory is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="mode must be one of: combined, profile, commits.",
        )

    return StreamingResponse(
        stream_factory(
            db,
            client,
            clean_usernames,
            allowed_usernames=allowed_usernames,
            since=since,
            until=until,
            project_ids=pid_list,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
