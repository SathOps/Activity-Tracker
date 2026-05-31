from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from internship_activity_tracker.application.exceptions import ForbiddenError
from internship_activity_tracker.infrastructure.models import MentorBatch, User


VALID_ROLES = {"intern", "mentor", "admin"}


def require_role(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise ForbiddenError("You do not have permission to perform this action.")


def require_admin(user: User) -> None:
    require_role(user, "admin")


def mentor_batch_ids(session: Session, user: User) -> list[int]:
    if user.role != "mentor":
        return []
    rows = session.execute(select(MentorBatch.batch_id).where(MentorBatch.mentor_id == user.id)).all()
    return [row[0] for row in rows]


def can_access_batch(session: Session, user: User, batch_id: int) -> bool:
    if user.role == "admin":
        return True
    if user.role == "mentor":
        return batch_id in set(mentor_batch_ids(session, user))
    return user.batch_id == batch_id
