from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.roster import CreateMyTeamPayload, SelfProfileUpdatePayload, SetBatchPayload, TeamRecord, TeamSelectionPayload, UserRecord
from internship_activity_tracker.application import team_service, user_service
from internship_activity_tracker.application.serializers import user_to_dict
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Me"])


@router.get("", response_model=UserRecord)
def get_me(current_user: User = Depends(get_current_user)):
    return UserRecord(**user_to_dict(current_user))


@router.patch("", response_model=UserRecord)
def update_me(payload: SelfProfileUpdatePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = user_service.update_self_profile(db, current_user, payload.model_dump(exclude_unset=True))
    return UserRecord(**result)


@router.patch("/batch", response_model=UserRecord)
def set_my_batch(payload: SetBatchPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = user_service.set_self_batch(db, current_user, payload.batch_id)
    return UserRecord(**result)


@router.get("/team")
def get_my_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.team_id:
        return {"team": None, "users": []}
    team = team_service.get_team(db, current_user, current_user.team_id)
    users = team_service.list_team_members(db, current_user, current_user.team_id)
    return {"team": TeamRecord(**team), "users": [UserRecord(**app_user) for app_user in users]}


@router.post("/team/create", response_model=TeamRecord)
def create_my_team(payload: CreateMyTeamPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = team_service.create_my_team(db, current_user, name=payload.name, batch_id=payload.batch_id)
    return TeamRecord(**result)


@router.post("/team/join", response_model=UserRecord)
def join_my_team(payload: TeamSelectionPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = team_service.join_team(db, current_user, payload.team_id)
    return UserRecord(**result)


@router.post("/team/leave", response_model=UserRecord)
def leave_my_team(payload: TeamSelectionPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = team_service.leave_team(db, current_user, payload.team_id)
    return UserRecord(**result)
