from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.standup import StandupResponse
from internship_activity_tracker.application import standup_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Standup"])


@router.get("", response_model=StandupResponse)
def get_standup_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return StandupResponse(data=standup_service.standup_overview(db, current_user))
