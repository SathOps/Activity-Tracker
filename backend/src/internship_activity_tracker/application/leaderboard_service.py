from __future__ import annotations

from internship_activity_tracker.application import team_service, user_service
from internship_activity_tracker.infrastructure.gitlab import batch as batch_engine


def _calculate_score(total_commits: int, merged_mrs: int, total_mrs: int, issues_closed: int) -> int:
    return total_commits * 1 + merged_mrs * 5 + total_mrs * 2 + issues_closed * 3


def _build_member_row(result: dict) -> dict:
    username = result.get("username", "unknown")
    result_status = result.get("status", "Error")

    if result_status != "Success":
        return {
            "username": username,
            "status": result_status,
            "error": result.get("error", "Unknown error"),
        }

    data = result.get("data", {})
    commit_stats = data.get("commit_stats", {})
    mr_stats = data.get("mr_stats", {})
    issue_stats = data.get("issue_stats", {})

    total_commits = commit_stats.get("total", 0)
    total_mrs = mr_stats.get("total", 0)
    merged_mrs = mr_stats.get("merged", 0)
    issues_closed = issue_stats.get("closed", 0)

    return {
        "username": username,
        "status": result_status,
        "total_commits": total_commits,
        "morning_commits": commit_stats.get("morning_commits", 0),
        "afternoon_commits": commit_stats.get("afternoon_commits", 0),
        "mr_created": total_mrs,
        "mr_merged": merged_mrs,
        "mr_open": mr_stats.get("opened", 0),
        "mr_closed": mr_stats.get("closed", 0),
        "mr_assigned": mr_stats.get("assigned", 0),
        "issues_raised": issue_stats.get("total", 0),
        "issues_closed": issues_closed,
        "issues_assigned": issue_stats.get("assigned", 0),
        "groups": len(data.get("groups", [])),
        "score": _calculate_score(total_commits, merged_mrs, total_mrs, issues_closed),
    }


def _aggregate_totals(member_rows: list[dict]) -> dict:
    totals = {
        "total_commits": 0,
        "morning_commits": 0,
        "afternoon_commits": 0,
        "mr_created": 0,
        "mr_merged": 0,
        "mr_open": 0,
        "mr_closed": 0,
        "mr_assigned": 0,
        "issues_raised": 0,
        "issues_closed": 0,
        "issues_assigned": 0,
        "team_score": 0,
    }
    for row in member_rows:
        totals["total_commits"] += row.get("total_commits", 0)
        totals["morning_commits"] += row.get("morning_commits", 0)
        totals["afternoon_commits"] += row.get("afternoon_commits", 0)
        totals["mr_created"] += row.get("mr_created", 0)
        totals["mr_merged"] += row.get("mr_merged", 0)
        totals["mr_open"] += row.get("mr_open", 0)
        totals["mr_closed"] += row.get("mr_closed", 0)
        totals["mr_assigned"] += row.get("mr_assigned", 0)
        totals["issues_raised"] += row.get("issues_raised", 0)
        totals["issues_closed"] += row.get("issues_closed", 0)
        totals["issues_assigned"] += row.get("issues_assigned", 0)
        totals["team_score"] += row.get("score", 0)
    return totals


def list_teams_for_leaderboard(session, actor) -> list[dict]:
    teams = team_service.list_teams(session, actor, active_only=False)
    result = []
    for team in teams:
        members = team_service.list_team_members(session, actor, team["id"])
        result.append(
            {
                "team_name": team["name"],
                "project_name": "",
                "members": [
                    {"username": member["gitlab_username"]}
                    for member in members
                    if member.get("gitlab_username")
                ],
                "scope": "all",
            }
        )
    return result


def analyze_teams(session, client, teams: list, *, since: str | None, until: str | None, allowed_usernames: list[str] | None) -> list[dict]:
    allowed = set(allowed_usernames) if allowed_usernames is not None else None
    team_results: list[dict] = []

    for team in teams:
        usernames = [member.username for member in team.members if member.username.strip()]
        if allowed is not None:
            usernames = [username for username in usernames if username in allowed]

        if not usernames:
            team_results.append(
                {
                    "team_name": team.team_name,
                    "project_name": team.project_name,
                    "members": [],
                    "totals": _aggregate_totals([]),
                }
            )
            continue

        overrides: dict = {}
        for username in usernames:
            user = user_service.get_user_by_username(session, username)
            if user:
                global_email = (user.get("global_email") or "").strip() or None
                global_username = (user.get("global_username") or "").strip() or None
                if global_email or global_username:
                    overrides[username] = {
                        "override_email": global_email,
                        "override_username": global_username,
                    }

        try:
            raw_results = batch_engine.process_batch_users(
                client,
                usernames,
                since=since,
                until=until,
                overrides=overrides or None,
            )
        except Exception as exc:
            raw_results = [{"username": username, "status": "Error", "error": str(exc)} for username in usernames]

        member_rows = [_build_member_row(result) for result in raw_results if result]
        member_rows.sort(key=lambda row: row.get("score", 0), reverse=True)
        team_results.append(
            {
                "team_name": team.team_name,
                "project_name": team.project_name,
                "members": member_rows,
                "totals": _aggregate_totals(member_rows),
            }
        )

    team_results.sort(key=lambda row: row["totals"]["team_score"], reverse=True)
    return team_results
