from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.roster import AddTeamMemberPayload, TeamDetailRecord, TeamListResponse, TeamPayload, TeamRecord, TeamUpdatePayload, UserRecord
from internship_activity_tracker.application import team_service, user_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Teams"])


@router.get("/", response_model=TeamListResponse)
def list_teams(
    batch_ids: str | None = Query(default=None),
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_batch_ids = [int(item) for item in batch_ids.split(",") if item.strip()] if batch_ids else None
    return TeamListResponse(teams=team_service.list_teams(db, current_user, batch_ids=parsed_batch_ids, active_only=active_only))


@router.post("/", response_model=TeamRecord)
def create_team(payload: TeamPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return TeamRecord(**team_service.create_team(db, current_user, name=payload.name, batch_id=payload.batch_id))


@router.get("/{team_id}", response_model=TeamDetailRecord)
def get_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return TeamDetailRecord(**team_service.get_team_detail(db, current_user, team_id))


@router.patch("/{team_id}", response_model=TeamRecord)
def update_team(team_id: int, payload: TeamUpdatePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return TeamRecord(**team_service.update_team(db, current_user, team_id, name=payload.name))


@router.delete("/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team_service.delete_team(db, current_user, team_id)
    return {"status": "ok"}


@router.post("/{team_id}/users", response_model=UserRecord)
def add_user(team_id: int, payload: AddTeamMemberPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = user_service.get_user_by_corpus_username(db, payload.corpus_username)
    if user is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="User not found.")
    return UserRecord(**team_service.join_team(db, current_user, team_id, target_user=user))


@router.delete("/{team_id}/users/{user_id}")
def remove_user(team_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = user_service._get_user(db, user_id)
    team_service.leave_team(db, current_user, team_id, target_user=user)
    return {"status": "ok"}
