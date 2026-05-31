from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from internship_activity_tracker.application.access import can_access_batch, require_admin, require_role
from internship_activity_tracker.application.exceptions import ConflictError, ForbiddenError, NotFoundError
from internship_activity_tracker.application.serializers import membership_to_dict, team_to_dict, user_to_dict
from internship_activity_tracker.infrastructure.models import Batch, Team, TeamMembership, User


def _get_team(session: Session, team_id: int) -> Team:
    team = session.scalar(
        select(Team)
        .options(selectinload(Team.batch), selectinload(Team.members), selectinload(Team.memberships))
        .where(Team.id == team_id)
    )
    if team is None:
        raise NotFoundError("Team not found.")
    return team


def _assert_unique_team_name(session: Session, name: str, excluding_team_id: int | None = None) -> None:
    query = select(Team).where(Team.name == name.strip())
    if excluding_team_id is not None:
        query = query.where(Team.id != excluding_team_id)
    existing = session.scalar(query)
    if existing is not None:
        raise ConflictError("A team with that name already exists.")


def _close_active_membership(session: Session, user: User, today: str) -> None:
    membership = session.scalar(
        select(TeamMembership).where(TeamMembership.user_id == user.id, TeamMembership.left_at.is_(None))
    )
    if membership is not None:
        membership.left_at = today


def _maybe_close_team(session: Session, team_id: int, today: str) -> None:
    team = session.get(Team, team_id)
    if team is None:
        return
    active_members = session.scalars(select(User).where(User.team_id == team_id)).all()
    if not active_members and team.end_date is None:
        team.end_date = today


def _move_user_to_team(session: Session, user: User, team: Team) -> None:
    today = date.today().isoformat()
    old_team_id = user.team_id
    if old_team_id:
        _close_active_membership(session, user, today)
    user.team_id = team.id
    user.batch_id = team.batch_id
    session.flush()
    if old_team_id and old_team_id != team.id:
        _maybe_close_team(session, old_team_id, today)
    session.add(TeamMembership(user_id=user.id, team_id=team.id, joined_at=today, left_at=None))
    if team.end_date is not None:
        team.end_date = None
    session.flush()


def list_teams(session: Session, actor: User, *, batch_ids: list[int] | None = None, active_only: bool = False) -> list[dict]:
    query = select(Team).options(selectinload(Team.batch), selectinload(Team.members)).order_by(Team.name)
    if batch_ids:
        query = query.where(Team.batch_id.in_(batch_ids))
    teams = session.scalars(query).all()
    if actor.role == "mentor":
        allowed = {assignment.batch_id for assignment in actor.mentor_batches}
        teams = [team for team in teams if team.batch_id in allowed]
    elif actor.role == "intern":
        if actor.team_id:
            teams = [team for team in teams if team.id == actor.team_id]
        elif actor.batch_id:
            teams = [team for team in teams if team.batch_id == actor.batch_id]
        else:
            teams = []
    if active_only:
        teams = [team for team in teams if team.end_date is None]
    return [team_to_dict(team) for team in teams]


def get_team(session: Session, actor: User, team_id: int) -> dict:
    team = _get_team(session, team_id)
    if not can_access_batch(session, actor, team.batch_id) and actor.role != "admin":
        raise ForbiddenError("You do not have access to this team.")
    return team_to_dict(team)


def get_team_detail(session: Session, actor: User, team_id: int) -> dict:
    team = _get_team(session, team_id)
    if not can_access_batch(session, actor, team.batch_id) and actor.role != "admin":
        raise ForbiddenError("You do not have access to this team.")
    memberships = session.scalars(
        select(TeamMembership)
        .options(selectinload(TeamMembership.team))
        .where(TeamMembership.team_id == team_id)
        .order_by(TeamMembership.joined_at, TeamMembership.id)
    ).all()
    detail = team_to_dict(team)
    detail["users"] = [user_to_dict(member) for member in team.members]
    detail["history"] = [membership_to_dict(row) for row in memberships]
    return detail


def _create_team(session: Session, actor: User, *, name: str, batch_id: int, attach_actor: bool) -> dict:
    batch = session.get(Batch, batch_id)
    if batch is None:
        raise NotFoundError("Batch not found.")
    _assert_unique_team_name(session, name)
    team = Team(
        name=name.strip(),
        batch_id=batch_id,
        start_date=date.today().isoformat(),
        end_date=None,
        created_by=actor.id,
    )
    session.add(team)
    session.flush()
    if attach_actor:
        _move_user_to_team(session, actor, team)
    return team_to_dict(team)


def create_team(session: Session, actor: User, *, name: str, batch_id: int) -> dict:
    require_admin(actor)
    return _create_team(session, actor, name=name, batch_id=batch_id, attach_actor=False)


def create_my_team(session: Session, actor: User, *, name: str, batch_id: int) -> dict:
    require_role(actor, "intern")
    if actor.batch_id != batch_id:
        raise ForbiddenError("You can only create a team in your own batch.")
    return _create_team(session, actor, name=name, batch_id=batch_id, attach_actor=True)


def update_team(session: Session, actor: User, team_id: int, *, name: str | None = None) -> dict:
    require_admin(actor)
    team = _get_team(session, team_id)
    if name and name.strip() != team.name:
        _assert_unique_team_name(session, name, excluding_team_id=team_id)
        team.name = name.strip()
    session.flush()
    return team_to_dict(team)


def delete_team(session: Session, actor: User, team_id: int) -> None:
    require_admin(actor)
    team = _get_team(session, team_id)
    if team.members:
        raise ConflictError("Remove all team members before deleting the team.")
    session.delete(team)


def join_team(session: Session, actor: User, team_id: int, *, target_user: User | None = None) -> dict:
    team = _get_team(session, team_id)
    subject = target_user or actor
    if actor.role == "intern" and target_user is not None and target_user.id != actor.id:
        raise ForbiddenError("Interns can only change their own team membership.")
    if actor.role == "mentor":
        raise ForbiddenError("Mentors cannot change team membership.")
    if actor.role == "intern" and actor.batch_id != team.batch_id:
        raise ForbiddenError("You can only join a team in your own batch.")
    if actor.role == "admin" and target_user and target_user.batch_id and target_user.batch_id != team.batch_id:
        target_user.batch_id = team.batch_id
    _move_user_to_team(session, subject, team)
    return user_to_dict(subject)


def leave_team(session: Session, actor: User, team_id: int, *, target_user: User | None = None) -> dict:
    subject = target_user or actor
    if actor.role == "intern" and target_user is not None and target_user.id != actor.id:
        raise ForbiddenError("Interns can only change their own team membership.")
    if actor.role == "mentor":
        raise ForbiddenError("Mentors cannot change team membership.")
    if subject.team_id != team_id:
        raise ConflictError("User is not a member of that team.")
    today = date.today().isoformat()
    _close_active_membership(session, subject, today)
    subject.team_id = None
    session.flush()
    _maybe_close_team(session, team_id, today)
    return user_to_dict(subject)


def list_team_members(session: Session, actor: User, team_id: int) -> list[dict]:
    team = _get_team(session, team_id)
    if not can_access_batch(session, actor, team.batch_id) and actor.role != "admin":
        raise ForbiddenError("You do not have access to this team.")
    return [user_to_dict(member) for member in team.members]
