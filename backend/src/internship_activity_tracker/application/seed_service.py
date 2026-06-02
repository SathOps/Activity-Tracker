from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from internship_activity_tracker.infrastructure.models import Batch, Team, TeamMembership, User


DEFAULT_BATCH_NAME = "Frontend Seed Batch"


@dataclass(slots=True)
class SeedStats:
    batch_created: bool = False
    users_created: int = 0
    users_reused: int = 0
    teams_created: int = 0
    teams_reused: int = 0
    memberships_created: int = 0
    memberships_reused: int = 0
    memberships_skipped: int = 0


def _csv_reader(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def _first_value(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = (row.get(key) or "").strip()
        if value:
            return value
    return ""


def _ensure_batch(session: Session, batch_name: str) -> tuple[Batch, bool]:
    batch = session.scalar(select(Batch).where(Batch.name == batch_name))
    if batch is not None:
        return batch, False
    batch = Batch(
        name=batch_name,
        date=date.today().isoformat(),
        start_date=None,
        end_date=None,
    )
    session.add(batch)
    session.flush()
    return batch, True


def _active_membership(session: Session, user_id: int) -> TeamMembership | None:
    return session.scalar(
        select(TeamMembership).where(
            TeamMembership.user_id == user_id,
            TeamMembership.left_at.is_(None),
        )
    )


def _close_team_if_empty(session: Session, team_id: int, today: str) -> None:
    team = session.get(Team, team_id)
    if team is None:
        return
    active_members = session.scalars(select(User).where(User.team_id == team_id)).all()
    if not active_members and team.end_date is None:
        team.end_date = today


def _assign_user_to_team(session: Session, user: User, team: Team, stats: SeedStats) -> None:
    today = date.today().isoformat()
    active_membership = _active_membership(session, user.id)

    if user.team_id == team.id and active_membership and active_membership.team_id == team.id:
        stats.memberships_reused += 1
        return

    if active_membership is not None:
        active_membership.left_at = today
        old_team_id = active_membership.team_id
    else:
        old_team_id = user.team_id

    user.team_id = team.id
    user.batch_id = team.batch_id
    session.flush()

    if old_team_id and old_team_id != team.id:
        _close_team_if_empty(session, old_team_id, today)

    session.add(
        TeamMembership(
            user_id=user.id,
            team_id=team.id,
            joined_at=today,
            left_at=None,
        )
    )
    if team.end_date is not None:
        team.end_date = None
    stats.memberships_created += 1
    session.flush()


def seed_frontend_csvs(
    session: Session,
    *,
    assets_dir: Path,
    batch_name: str = DEFAULT_BATCH_NAME,
) -> SeedStats:
    interns_path = assets_dir / "interns.csv"
    teams_path = assets_dir / "teams.csv"
    members_path = assets_dir / "team_members.csv"

    stats = SeedStats()
    batch, stats.batch_created = _ensure_batch(session, batch_name)

    intern_rows = _csv_reader(interns_path)
    team_rows = _csv_reader(teams_path)
    membership_rows = _csv_reader(members_path)

    users_by_seed_key: dict[str, User] = {}
    users_by_name: dict[str, User] = {}

    for row in intern_rows:
        intern_id = _first_value(row, "intern_id")
        if not intern_id or intern_id in users_by_seed_key:
            continue
        intern_name = _first_value(row, "intern_name") or intern_id
        user = session.scalar(select(User).where(User.corpus_username == intern_id))
        if user is None:
            user = User(
                name=intern_name,
                corpus_username=intern_id,
                role="intern",
                batch_id=batch.id,
            )
            session.add(user)
            session.flush()
            stats.users_created += 1
        else:
            if not (user.name or "").strip():
                user.name = intern_name
            if user.batch_id is None:
                user.batch_id = batch.id
            stats.users_reused += 1
        users_by_seed_key[intern_id] = user
        users_by_name[intern_name.casefold()] = user

    teams_by_seed_key: dict[str, Team] = {}
    teams_by_name: dict[str, Team] = {}

    for row in team_rows:
        team_key = _first_value(row, "team_id", "teamid")
        team_name = _first_value(row, "team_name", "teamname")
        if not team_name or team_key in teams_by_seed_key:
            continue
        team = session.scalar(select(Team).where(Team.name == team_name))
        if team is None:
            team = Team(
                name=team_name,
                batch_id=batch.id,
                start_date=date.today().isoformat(),
                end_date=None,
                created_by=None,
            )
            session.add(team)
            session.flush()
            stats.teams_created += 1
        else:
            if team.batch_id != batch.id:
                raise ValueError(
                    f"Existing team '{team_name}' belongs to batch_id={team.batch_id}, not seed batch_id={batch.id}."
                )
            stats.teams_reused += 1
        teams_by_seed_key[team_key] = team
        teams_by_name[team_name.casefold()] = team

    for row in membership_rows:
        team_key = _first_value(row, "team_id")
        team_name = _first_value(row, "team_name")
        team = teams_by_seed_key.get(team_key) or teams_by_name.get(team_name.casefold())

        intern_id = _first_value(row, "intern_id")
        student_name = _first_value(row, "student_name")
        user = (
            users_by_seed_key.get(intern_id)
            or users_by_name.get(student_name.casefold())
            or users_by_seed_key.get(student_name)
        )

        if team is None or user is None:
            stats.memberships_skipped += 1
            continue

        _assign_user_to_team(session, user, team, stats)

    return stats
