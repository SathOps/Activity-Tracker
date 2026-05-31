from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_allowed_gitlab_usernames, get_db, get_gitlab_client, require_mentor_or_admin
from app.schemas.leaderboard import LeaderboardAnalyzeRequest, LeaderboardAnalyzeResponse, TeamResult, TeamsListResponse
from internship_activity_tracker.application import leaderboard_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Leaderboard"])


@router.get("/teams", response_model=TeamsListResponse)
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_mentor_or_admin),
) -> TeamsListResponse:
    return TeamsListResponse(teams=leaderboard_service.list_teams_for_leaderboard(db, current_user))


@router.post("/analyze", response_model=LeaderboardAnalyzeResponse)
def analyze_teams(
    body: LeaderboardAnalyzeRequest,
    db: Session = Depends(get_db),
    client=Depends(get_gitlab_client),
    current_user: User = Depends(require_mentor_or_admin),
    allowed_usernames: list[str] | None = Depends(get_allowed_gitlab_usernames),
) -> LeaderboardAnalyzeResponse:
    results = leaderboard_service.analyze_teams(
        db,
        client,
        body.teams,
        since=body.since,
        until=body.until,
        allowed_usernames=allowed_usernames,
    )
    return LeaderboardAnalyzeResponse(teams=[TeamResult(**result) for result in results])
