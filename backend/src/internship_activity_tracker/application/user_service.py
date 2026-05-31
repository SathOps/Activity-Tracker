from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from internship_activity_tracker.application.access import require_admin
from internship_activity_tracker.application.exceptions import ConflictError, NotFoundError
from internship_activity_tracker.application.serializers import user_to_dict
from internship_activity_tracker.infrastructure.models import Batch, User


def _get_user(session: Session, user_id: int) -> User:
    user = session.scalar(
        select(User)
        .options(selectinload(User.batch), selectinload(User.team), selectinload(User.memberships))
        .where(User.id == user_id)
    )
    if user is None:
        raise NotFoundError("User not found.")
    return user


def get_user_by_corpus_username(session: Session, corpus_username: str) -> User | None:
    return session.scalar(
        select(User)
        .options(selectinload(User.batch), selectinload(User.team), selectinload(User.mentor_batches))
        .where(User.corpus_username == corpus_username)
    )


def list_users(
    session: Session,
    actor: User,
    *,
    q: str | None = None,
    team_ids: list[int] | None = None,
    batch_ids: list[int] | None = None,
) -> list[dict]:
    query = select(User).options(selectinload(User.batch), selectinload(User.team)).order_by(User.name)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                User.name.ilike(pattern),
                User.corpus_username.ilike(pattern),
                User.gitlab_username.ilike(pattern),
            )
        )
    if team_ids:
        query = query.where(User.team_id.in_(team_ids))
    if batch_ids:
        query = query.where(User.batch_id.in_(batch_ids))
    users = session.scalars(query).all()
    if actor.role == "mentor":
        allowed = {assignment.batch_id for assignment in actor.mentor_batches}
        users = [user for user in users if user.batch_id in allowed]
    return [user_to_dict(user) for user in users]


def search_users(session: Session, actor: User, query: str) -> list[dict]:
    return list_users(session, actor, q=query)


def get_user(session: Session, actor: User, user_id: int) -> dict:
    user = _get_user(session, user_id)
    if actor.role == "mentor":
        allowed = {assignment.batch_id for assignment in actor.mentor_batches}
        if user.batch_id not in allowed:
            from internship_activity_tracker.application.exceptions import ForbiddenError

            raise ForbiddenError("You do not have access to this user.")
    return user_to_dict(user)


def update_self_profile(session: Session, actor: User, payload: dict) -> dict:
    actor.gitlab_username = (payload.get("gitlab_username") or actor.gitlab_username or "").strip() or None
    actor.global_username = (payload.get("global_username") or actor.global_username or "").strip() or None
    actor.global_email = (payload.get("global_email") or actor.global_email or "").strip() or None
    actor.date_of_joining = (payload.get("date_of_joining") or actor.date_of_joining or "").strip() or None
    if actor.gitlab_username:
        existing = session.scalar(select(User).where(User.gitlab_username == actor.gitlab_username, User.id != actor.id))
        if existing is not None:
            raise ConflictError("That GitLab username is already linked to another user.")
    session.flush()
    return user_to_dict(actor)


def update_user_profile(session: Session, actor: User, user_id: int, payload: dict) -> dict:
    require_admin(actor)
    user = _get_user(session, user_id)
    for field in ("gitlab_username", "global_username", "global_email", "date_of_joining"):
        if field in payload:
            value = str(payload.get(field) or "").strip() or None
            setattr(user, field, value)
    if "batch_id" in payload:
        user.batch_id = payload.get("batch_id")
    if "team_id" in payload:
        user.team_id = payload.get("team_id")
    if "role" in payload:
        role = str(payload.get("role") or "").strip()
        if role not in {"intern", "mentor", "admin"}:
            raise ConflictError("Invalid role.")
        user.role = role
    if user.gitlab_username:
        existing = session.scalar(select(User).where(User.gitlab_username == user.gitlab_username, User.id != user.id))
        if existing is not None:
            raise ConflictError("That GitLab username is already linked to another user.")
    session.flush()
    return user_to_dict(user)


def set_self_batch(session: Session, actor: User, batch_id: int) -> dict:
    batch = session.get(Batch, batch_id)
    if batch is None:
        raise NotFoundError("Batch not found.")
    actor.batch_id = batch_id
    session.flush()
    return user_to_dict(actor)


def delete_user(session: Session, actor: User, user_id: int) -> None:
    require_admin(actor)
    user = _get_user(session, user_id)
    session.delete(user)


def create_user(session: Session, actor: User, payload: dict) -> dict:
    require_admin(actor)
    username = str(payload["corpus_username"]).strip()
    existing = get_user_by_corpus_username(session, username)
    if existing is not None:
        raise ConflictError("A user with that corpus username already exists.")
    user = User(
        name=str(payload["name"]).strip(),
        corpus_username=username,
        email=(str(payload.get("email") or "").strip() or None),
        institution_id=(str(payload.get("institution_id") or "").strip() or None),
        institution_name=(str(payload.get("institution_name") or "").strip() or None),
        gitlab_username=(str(payload.get("gitlab_username") or "").strip() or None),
        global_username=(str(payload.get("global_username") or "").strip() or None),
        global_email=(str(payload.get("global_email") or "").strip() or None),
        date_of_joining=(str(payload.get("date_of_joining") or "").strip() or None),
        role=str(payload.get("role") or "intern").strip() or "intern",
        batch_id=payload.get("batch_id"),
    )
    session.add(user)
    session.flush()
    return user_to_dict(user)


def get_user_by_username(session: Session, username: str) -> dict | None:
    user = session.scalar(
        select(User)
        .options(selectinload(User.batch), selectinload(User.team))
        .where(or_(User.gitlab_username == username, User.corpus_username == username))
    )
    return user_to_dict(user) if user else None


def get_member_by_username(session: Session, username: str) -> dict | None:
    return get_user_by_username(session, username)
