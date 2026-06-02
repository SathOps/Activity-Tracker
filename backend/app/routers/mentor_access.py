"""
Deprecated — Mentor Access router.

These endpoints are not consumed by the frontend and are kept only for
backward compatibility. They may be removed in a future release.
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.roster import MentorAccessListResponse, MentorAccessPayload, MentorAccessRecord
from internship_activity_tracker.application import mentor_access_service
from internship_activity_tracker.infrastructure.models import User

logger = logging.getLogger(__name__)
logger.warning("mentor_access router is deprecated and may be removed in a future release.")

router = APIRouter(tags=["Mentor Access (Deprecated)"])


@router.get("", response_model=MentorAccessListResponse)
def list_mentor_access(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MentorAccessListResponse(assignments=[MentorAccessRecord(**row) for row in mentor_access_service.list_assignments(db, current_user)])


@router.post("", response_model=MentorAccessRecord)
def create_mentor_access(payload: MentorAccessPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return MentorAccessRecord(**mentor_access_service.create_assignment(db, current_user, payload.mentor_id, payload.batch_id))


@router.delete("/{mentor_id}/batches/{batch_id}")
def delete_mentor_access(mentor_id: int, batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mentor_access_service.delete_assignment(db, current_user, mentor_id, batch_id)
    return {"status": "ok"}
