from __future__ import annotations

from internship_activity_tracker.infrastructure.models import Batch, MentorBatch, Team, TeamMembership, User


def batch_to_dict(batch: Batch) -> dict:
    return {
        "id": batch.id,
        "name": batch.name,
        "start_date": batch.start_date or "",
        "end_date": batch.end_date or "",
    }


def team_to_dict(team: Team) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "batch_id": team.batch_id,
        "batch_name": team.batch.name if team.batch else "",
        "start_date": team.start_date,
        "end_date": team.end_date or "",
        "created_by": team.created_by,
        "member_count": len(team.members),
        "is_active": team.end_date is None,
    }


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "corpus_username": user.corpus_username,
        "email": user.email or "",
        "institution_id": user.institution_id or "",
        "institution_name": user.institution_name or "",
        "gitlab_username": user.gitlab_username or "",
        "global_username": user.global_username or "",
        "global_email": user.global_email or "",
        "date_of_joining": user.date_of_joining or "",
        "role": user.role,
        "team_id": user.team_id,
        "team_name": user.team.name if user.team else "",
        "batch_id": user.batch_id,
        "batch_name": user.batch.name if user.batch else "",
        "mentor_batch_ids": [assignment.batch_id for assignment in user.mentor_batches],
    }


def membership_to_dict(membership: TeamMembership) -> dict:
    return {
        "id": membership.id,
        "user_id": membership.user_id,
        "team_id": membership.team_id,
        "team_name": membership.team.name if membership.team else "",
        "joined_at": membership.joined_at,
        "left_at": membership.left_at or "",
    }


def mentor_access_to_dict(assignment: MentorBatch) -> dict:
    return {
        "id": assignment.id,
        "mentor_id": assignment.mentor_id,
        "mentor_name": assignment.mentor.name if assignment.mentor else "",
        "mentor_username": assignment.mentor.corpus_username if assignment.mentor else "",
        "batch_id": assignment.batch_id,
        "batch_name": assignment.batch.name if assignment.batch else "",
    }
