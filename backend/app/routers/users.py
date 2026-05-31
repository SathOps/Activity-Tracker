from fastapi import APIRouter, Depends, Query
from fastapi import File, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.roster import UserCreatePayload, UserListResponse, UserRecord, UserUpdatePayload
from internship_activity_tracker.application import user_service
from internship_activity_tracker.infrastructure.models import User
from internship_activity_tracker.services.weekly_performance.models import parse_intern_csv

router = APIRouter(tags=["Users"])


@router.get("/", response_model=UserListResponse)
def list_users(
    q: str | None = Query(default=None),
    team_ids: str | None = Query(default=None),
    batch_ids: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_team_ids = [int(item) for item in team_ids.split(",") if item.strip()] if team_ids else None
    parsed_batch_ids = [int(item) for item in batch_ids.split(",") if item.strip()] if batch_ids else None
    users = user_service.list_users(
        db,
        current_user,
        q=q,
        team_ids=parsed_team_ids,
        batch_ids=parsed_batch_ids,
    )
    return UserListResponse(users=users)


@router.post("/", response_model=UserRecord)
def create_user(payload: UserCreatePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UserRecord(**user_service.create_user(db, current_user, payload.model_dump()))


@router.post("/import/{batch_id}")
async def import_users(batch_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = await file.read()
    rows = parse_intern_csv(content)
    imported = 0
    errors: list[str] = []
    for index, row in enumerate(rows, start=1):
        try:
            payload = {
                "name": row.get("name") or row.get("gitlab_username") or row.get("corpus_username"),
                "corpus_username": row.get("corpus_username") or row.get("gitlab_username") or f"imported-{index}",
                "batch_id": batch_id,
                "role": row.get("role") or "intern",
                "email": row.get("email"),
                "institution_id": row.get("institution_id"),
                "institution_name": row.get("institution_name"),
                "gitlab_username": row.get("gitlab_username"),
                "global_username": row.get("global_username"),
                "global_email": row.get("global_email"),
                "date_of_joining": row.get("date_of_joining"),
            }
            user_service.create_user(db, current_user, payload)
            imported += 1
        except Exception as exc:
            errors.append(f"Row {index}: {exc}")
    return {"imported": imported, "errors": errors}


@router.get("/{user_id}", response_model=UserRecord)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UserRecord(**user_service.get_user(db, current_user, user_id))


@router.patch("/{user_id}", response_model=UserRecord)
def update_user(user_id: int, payload: UserUpdatePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UserRecord(**user_service.update_user_profile(db, current_user, user_id, payload.model_dump(exclude_unset=True)))


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_service.delete_user(db, current_user, user_id)
    return {"status": "ok"}
