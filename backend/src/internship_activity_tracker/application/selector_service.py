from __future__ import annotations

from internship_activity_tracker.application import batch_service, team_service, user_service


def get_scoped_tree(session, actor) -> dict:
    batches = batch_service.list_batches(session, actor)
    batch_ids = [batch["id"] for batch in batches]
    teams = team_service.list_teams(session, actor, batch_ids=batch_ids or None, active_only=False)
    users = user_service.list_users(session, actor, batch_ids=batch_ids or None)
    return {
        "batches": batches,
        "teams": teams,
        "users": users,
    }
