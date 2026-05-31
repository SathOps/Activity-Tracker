"""Compatibility shim over the rewritten application services."""

from __future__ import annotations

from sqlalchemy import select

from internship_activity_tracker.application.auth_service import sync_user_from_corpus
from internship_activity_tracker.application.serializers import team_to_dict
from internship_activity_tracker.application.user_service import get_member_by_username as _get_member_by_username
from internship_activity_tracker.infrastructure.database import get_session
from internship_activity_tracker.infrastructure.models import Team


def create_or_update_user_from_corpus(me: dict):
    with get_session() as session:
        user = sync_user_from_corpus(session, me)
        session.flush()
        session.refresh(user)
        from internship_activity_tracker.application.serializers import user_to_dict

        return user_to_dict(user)


def get_member_by_username(username: str):
    with get_session() as session:
        return _get_member_by_username(session, username)


def get_all_teams_with_members():
    with get_session() as session:
        teams = session.scalars(select(Team).order_by(Team.name)).all()
        return [
            {
                "team_name": team.name,
                "batch_id": team.batch_id,
                "project_name": team.batch.name if team.batch else "",
                "members": [
                    {"username": member.gitlab_username or member.corpus_username, "name": member.name}
                    for member in team.members
                ],
            }
            for team in teams
        ]
