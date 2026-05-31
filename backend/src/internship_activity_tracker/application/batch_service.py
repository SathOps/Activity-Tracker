from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from internship_activity_tracker.application.access import can_access_batch, require_admin
from internship_activity_tracker.application.exceptions import ConflictError, NotFoundError
from internship_activity_tracker.application.serializers import batch_to_dict, team_to_dict, user_to_dict
from internship_activity_tracker.infrastructure.models import Batch, Team, User


def list_batches(session: Session, actor: User) -> list[dict]:
    rows = session.scalars(select(Batch).order_by(Batch.name)).all()
    if actor.role == "admin":
        return [batch_to_dict(row) for row in rows]
    if actor.role == "mentor":
        allowed = {assignment.batch_id for assignment in actor.mentor_batches}
        rows = [row for row in rows if row.id in allowed]
    return [batch_to_dict(row) for row in rows]


def get_batch(session: Session, actor: User, batch_id: int) -> Batch:
    batch = session.get(Batch, batch_id)
    if batch is None:
        raise NotFoundError("Batch not found.")
    if not can_access_batch(session, actor, batch_id):
        from internship_activity_tracker.application.exceptions import ForbiddenError

        raise ForbiddenError("You do not have access to this batch.")
    return batch


def create_batch(session: Session, actor: User, *, name: str, start_date: str | None, end_date: str | None) -> dict:
    require_admin(actor)
    existing = session.scalar(select(Batch).where(Batch.name == name))
    if existing is not None:
        raise ConflictError("A batch with that name already exists.")
    batch = Batch(
        name=name.strip(),
        date=date.today().isoformat(),
        start_date=start_date or None,
        end_date=end_date or None,
    )
    session.add(batch)
    session.flush()
    return batch_to_dict(batch)


def update_batch(session: Session, actor: User, batch_id: int, *, name: str | None, start_date: str | None, end_date: str | None) -> dict:
    require_admin(actor)
    batch = get_batch(session, actor, batch_id)
    if name and name.strip() != batch.name:
        existing = session.scalar(select(Batch).where(Batch.name == name.strip(), Batch.id != batch.id))
        if existing is not None:
            raise ConflictError("A batch with that name already exists.")
        batch.name = name.strip()
    if start_date is not None:
        batch.start_date = start_date or None
    if end_date is not None:
        batch.end_date = end_date or None
    session.flush()
    return batch_to_dict(batch)


def delete_batch(session: Session, actor: User, batch_id: int) -> None:
    require_admin(actor)
    batch = get_batch(session, actor, batch_id)
    if batch.teams or batch.users or batch.mentor_assignments:
        raise ConflictError("Batch cannot be deleted while users, teams, or mentor assignments still exist.")
    session.delete(batch)


def list_batch_teams(session: Session, actor: User, batch_id: int) -> list[dict]:
    get_batch(session, actor, batch_id)
    teams = session.scalars(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.batch))
        .where(Team.batch_id == batch_id)
        .order_by(Team.name)
    ).all()
    return [team_to_dict(team) for team in teams]


def list_batch_users(session: Session, actor: User, batch_id: int) -> list[dict]:
    get_batch(session, actor, batch_id)
    users = session.scalars(
        select(User)
        .options(selectinload(User.batch), selectinload(User.team))
        .where(User.batch_id == batch_id)
        .order_by(User.name)
    ).all()
    return [user_to_dict(user) for user in users]
