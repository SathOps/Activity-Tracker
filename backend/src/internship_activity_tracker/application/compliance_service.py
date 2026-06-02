from __future__ import annotations

from internship_activity_tracker.infrastructure.gitlab import batch as batch_engine
from internship_activity_tracker.services.profile import service as profile_service


def get_gitlab_profile(client, username: str) -> dict:
    profile = profile_service.get_user_profile(client, username)
    if not profile:
        return {}
    user_id = profile.get("id")
    return {
        "user": profile,
        "projects_count": profile_service.get_user_projects_count(client, user_id) if user_id else 0,
        "groups_count": profile_service.get_user_groups_count(client, user_id) if user_id else 0,
        "open_merge_requests": profile_service.get_user_open_mrs_count(client, user_id) if user_id else 0,
        "open_issues": profile_service.get_user_open_issues_count(client, user_id) if user_id else 0,
        "issues_details": profile_service.get_user_issues_details(client, user_id) if user_id else {},
        "issues_list": profile_service.get_user_issues_list(client, user_id) if user_id else [],
        "profile_readme": profile_service.check_profile_readme(client, profile.get("username", "")),
    }


def get_user_commits(client, username: str, since: str | None = None, until: str | None = None, project_ids: list[int] | None = None) -> dict:
    return batch_engine.fetch_user_commits_only(
        client,
        username,
        since=since,
        until=until,
        project_ids=project_ids,
    )


def get_user_detail(client, username: str, since: str | None = None, until: str | None = None, project_ids: list[int] | None = None) -> dict:
    return {
        "profile": get_gitlab_profile(client, username),
        "commits": get_user_commits(
            client,
            username,
            since=since,
            until=until,
            project_ids=project_ids,
        ),
    }
