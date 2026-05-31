from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.roster import BatchListResponse, BatchPayload, BatchRecord, BatchUpdatePayload, TeamListResponse, UserListResponse
from internship_activity_tracker.application import batch_service
from internship_activity_tracker.application.serializers import batch_to_dict
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["Batches"])


@router.get("/", response_model=BatchListResponse)
def list_batches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BatchListResponse(batches=[BatchRecord(**row) for row in batch_service.list_batches(db, current_user)])


@router.post("/", response_model=BatchRecord)
def create_batch(payload: BatchPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BatchRecord(**batch_service.create_batch(db, current_user, name=payload.name, start_date=payload.start_date, end_date=payload.end_date))


@router.get("/{batch_id}", response_model=BatchRecord)
def get_batch(batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BatchRecord(**batch_to_dict(batch_service.get_batch(db, current_user, batch_id)))


@router.patch("/{batch_id}", response_model=BatchRecord)
def update_batch(batch_id: int, payload: BatchUpdatePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BatchRecord(**batch_service.update_batch(db, current_user, batch_id, name=payload.name, start_date=payload.start_date, end_date=payload.end_date))


@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch_service.delete_batch(db, current_user, batch_id)
    return {"status": "ok"}


@router.get("/{batch_id}/teams", response_model=TeamListResponse)
def list_batch_teams(batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return TeamListResponse(teams=batch_service.list_batch_teams(db, current_user, batch_id))


@router.get("/{batch_id}/users", response_model=UserListResponse)
def list_batch_users(batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UserListResponse(users=batch_service.list_batch_users(db, current_user, batch_id))
