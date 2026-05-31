from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from internship_activity_tracker.application.access import require_admin
from internship_activity_tracker.application.exceptions import ConflictError, NotFoundError
from internship_activity_tracker.application.serializers import mentor_access_to_dict
from internship_activity_tracker.infrastructure.models import Batch, MentorBatch, User


def list_assignments(session: Session, actor: User) -> list[dict]:
    require_admin(actor)
    rows = session.scalars(
        select(MentorBatch)
        .options(selectinload(MentorBatch.mentor), selectinload(MentorBatch.batch))
        .order_by(MentorBatch.mentor_id, MentorBatch.batch_id)
    ).all()
    return [mentor_access_to_dict(row) for row in rows]


def create_assignment(session: Session, actor: User, mentor_id: int, batch_id: int) -> dict:
    require_admin(actor)
    mentor = session.get(User, mentor_id)
    batch = session.get(Batch, batch_id)
    if mentor is None or batch is None:
        raise NotFoundError("Mentor or batch not found.")
    existing = session.scalar(
        select(MentorBatch).where(MentorBatch.mentor_id == mentor_id, MentorBatch.batch_id == batch_id)
    )
    if existing is not None:
        raise ConflictError("That mentor already has access to the batch.")
    row = MentorBatch(mentor_id=mentor_id, batch_id=batch_id)
    session.add(row)
    session.flush()
    session.refresh(row)
    return mentor_access_to_dict(row)


def delete_assignment(session: Session, actor: User, mentor_id: int, batch_id: int) -> None:
    require_admin(actor)
    row = session.scalar(
        select(MentorBatch).where(MentorBatch.mentor_id == mentor_id, MentorBatch.batch_id == batch_id)
    )
    if row is None:
        raise NotFoundError("Mentor batch assignment not found.")
    session.delete(row)
