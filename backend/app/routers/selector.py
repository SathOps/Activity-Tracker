from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.roster import BatchRecord, SelectorTreeResponse, TeamRecord, UserRecord
from internship_activity_tracker.application import selector_service
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Selector"])


@router.get("", response_model=SelectorTreeResponse)
def get_selector_tree(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payload = selector_service.get_scoped_tree(db, current_user)
    return SelectorTreeResponse(
        batches=[BatchRecord(**row) for row in payload["batches"]],
        teams=[TeamRecord(**row) for row in payload["teams"]],
        users=[UserRecord(**row) for row in payload["users"]],
    )
