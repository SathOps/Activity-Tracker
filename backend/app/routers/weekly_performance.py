from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_allowed_gitlab_usernames, get_corpus_token, get_db, get_gitlab_client, get_current_user, require_mentor_or_admin
from app.schemas.weekly_performance import BatchWeeklyRequest, WeeklyActivityResponse, WeeklyPerformanceRequest
from internship_activity_tracker.application import weekly_performance_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Weekly Performance"])


@router.post("/single", response_model=WeeklyActivityResponse)
def get_single_intern_weekly(
    body: WeeklyPerformanceRequest,
    current_user: User = Depends(get_current_user),
    corpus_token: str = Depends(get_corpus_token),
    client=Depends(get_gitlab_client),
) -> WeeklyActivityResponse:
    return weekly_performance_service.get_single_weekly_activity(
        current_user,
        client,
        corpus_token,
        start_date=body.start_date,
        end_date=body.end_date,
    )


@router.post("/batch", response_model=list[WeeklyActivityResponse])
def get_batch_weekly(
    body: BatchWeeklyRequest,
    db: Session = Depends(get_db),
    client=Depends(get_gitlab_client),
    current_user: User = Depends(require_mentor_or_admin),
    allowed_usernames: list[str] | None = Depends(get_allowed_gitlab_usernames),
) -> list[WeeklyActivityResponse]:
    return weekly_performance_service.get_batch_weekly_activity(
        db,
        current_user,
        client,
        body.interns,
        start_date=body.start_date,
        end_date=body.end_date,
        allowed_usernames=allowed_usernames,
    )
