from __future__ import annotations

from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from internship_activity_tracker.infrastructure.models import Team, User


def _scoped_teams(session: Session, actor: User) -> list[Team]:
    query = select(Team).options(selectinload(Team.members), selectinload(Team.batch)).order_by(Team.name)
    teams = session.scalars(query).all()
    if actor.role == "admin":
        return teams
    if actor.role == "mentor":
        allowed = {assignment.batch_id for assignment in actor.mentor_batches}
        return [team for team in teams if team.batch_id in allowed]
    if actor.team_id:
        return [team for team in teams if team.id == actor.team_id]
    return [team for team in teams if actor.batch_id and team.batch_id == actor.batch_id]


def standup_dashboard(session: Session, actor: User) -> dict:
    teams = _scoped_teams(session, actor)
    members = [member for team in teams for member in team.members]
    return {
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "batch_id": team.batch_id,
                "batch_name": team.batch.name if team.batch else "",
                "member_count": len(team.members),
                "members": [
                    {
                        "id": member.id,
                        "name": member.name,
                        "corpus_username": member.corpus_username,
                        "gitlab_username": member.gitlab_username or "",
                    }
                    for member in sorted(team.members, key=lambda item: item.name.lower())
                ],
            }
            for team in teams
        ],
        "summary": {
            "team_count": len(teams),
            "member_count": len(members),
        },
    }


def standup_analytics(session: Session, actor: User) -> dict:
    teams = _scoped_teams(session, actor)
    batch_counts = Counter(team.batch.name if team.batch else "Unassigned" for team in teams)
    return {
        "scope": actor.role,
        "team_count": len(teams),
        "batch_breakdown": [{"batch_name": name, "team_count": count} for name, count in sorted(batch_counts.items())],
    }


def standup_overview(session: Session, actor: User) -> dict:
    return {
        "scope": actor.role,
        "dashboard": standup_dashboard(session, actor),
        "analytics": standup_analytics(session, actor),
    }
