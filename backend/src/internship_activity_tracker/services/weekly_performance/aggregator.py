"""
Weekly performance aggregator.

Data sources:
  - User lookup  : GraphQL (GQL_USER_LOOKUP via users.get_user_by_username_async)
  - Projects     : GraphQL (GQL_USER_PROJECTS via projects.get_user_projects_async)
  - MRs          : GraphQL (GQL_USER_MRS_AUTHORED/ASSIGNED via merge_requests.get_user_mrs_async)
  - Issues       : GraphQL (GQL_USER_ISSUES_* via issues.get_user_issues_async)
  - Timelogs     : REST  (GraphQL timelogs require admin scope for non-self users)
  - Commits      : REST  (same async path as the batch commits stream)

All GraphQL functions fall back to REST automatically when _gql is unavailable.
"""

import asyncio
import logging
from collections import defaultdict
from datetime import date, timedelta, timezone

import dateutil.parser

from internship_activity_tracker.infrastructure.gitlab import (
    commits,
    issues,
    merge_requests,
    projects,
    users,
)
from internship_activity_tracker.infrastructure.gitlab.bridge import run_on_loop
from internship_activity_tracker.infrastructure.gitlab.timelogs import (
    aggregate_daily_time_categorized,
    build_daily_time_from_time_stats,
    fetch_user_timelogs_from_projects_async,
)
from internship_activity_tracker.services.weekly_performance.models import (
    CorpusDailyData,
    DailyData,
    EventDetail,
    GitLabDailyData,
    WeeklyActivity,
)

IST = timezone(timedelta(hours=5, minutes=30))
logger = logging.getLogger(__name__)


# ── Timestamp helpers ──────────────────────────────────────────────────────────


def _parse_ist_date(timestamp: str) -> str:
    """Parse an ISO timestamp and return IST date string YYYY-MM-DD."""
    if not timestamp:
        return ""
    try:
        dt = dateutil.parser.isoparse(timestamp)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST).strftime("%Y-%m-%d")
    except Exception:
        return timestamp.split("T")[0] if "T" in timestamp else timestamp[:10]


def _get_ist_hour(timestamp: str) -> int | None:
    """Parse an ISO timestamp and return IST hour (0-23)."""
    if not timestamp:
        return None
    try:
        dt = dateutil.parser.isoparse(timestamp)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST).hour
    except Exception:
        return None


# ── Date-range bucketing helpers ───────────────────────────────────────────────


def _bucket_mrs(
    raw_mrs: list[dict],
    start_date_str: str,
    end_date_str: str,
) -> tuple[dict[str, int], dict[str, set[int]], dict[str, dict[int, list[EventDetail]]]]:
    counts: dict[str, int] = defaultdict(int)
    active_hours: dict[str, set[int]] = defaultdict(set)
    events: dict[str, dict[int, list[EventDetail]]] = defaultdict(lambda: defaultdict(list))

    for mr in raw_mrs:
        act_ts = mr.get("merged_at") or mr.get("closed_at") or mr.get("updated_at", "")
        if not act_ts:
            continue
        date_str = _parse_ist_date(act_ts)
        if not (start_date_str <= date_str <= end_date_str):
            continue
        if mr.get("state") == "merged":
            counts[date_str] += 1
        hour = _get_ist_hour(act_ts)
        if hour is not None:
            active_hours[date_str].add(hour)
            state = mr.get("state", "opened").capitalize()
            events[date_str][hour].append(
                {"type": "mr", "title": f"[{state}] {mr.get('title', '')}", "url": mr.get("web_url", ""), "timestamp": act_ts}
            )

    return dict(counts), dict(active_hours), dict(events)


def _bucket_issues(
    raw_issues: list[dict],
    start_date_str: str,
    end_date_str: str,
) -> tuple[dict[str, int], dict[str, set[int]], dict[str, dict[int, list[EventDetail]]]]:
    counts: dict[str, int] = defaultdict(int)
    active_hours: dict[str, set[int]] = defaultdict(set)
    events: dict[str, dict[int, list[EventDetail]]] = defaultdict(lambda: defaultdict(list))

    for issue in raw_issues:
        act_ts = issue.get("closed_at") or issue.get("created_at", "")
        if not act_ts:
            continue
        date_str = _parse_ist_date(act_ts)
        if not (start_date_str <= date_str <= end_date_str):
            continue
        counts[date_str] += 1
        hour = _get_ist_hour(act_ts)
        if hour is not None:
            active_hours[date_str].add(hour)
            state = issue.get("state", "opened").capitalize()
            events[date_str][hour].append(
                {"type": "issue", "title": f"[{state}] {issue.get('title', '')}", "url": issue.get("web_url", ""), "timestamp": act_ts}
            )

    return dict(counts), dict(active_hours), dict(events)


def _bucket_commits(
    all_commits: list[dict],
    start_date_str: str,
    end_date_str: str,
) -> tuple[dict[str, int], dict[str, set[int]], dict[str, dict[int, list[EventDetail]]]]:
    counts: dict[str, int] = defaultdict(int)
    active_hours: dict[str, set[int]] = defaultdict(set)
    events: dict[str, dict[int, list[EventDetail]]] = defaultdict(lambda: defaultdict(list))

    for commit in all_commits or []:
        commit_date = commit.get("date", "")
        if not (commit_date and commit_date != "N/A" and start_date_str <= commit_date <= end_date_str):
            continue
        counts[commit_date] += 1
        time_str = commit.get("time", "")
        if time_str and ":" in time_str:
            try:
                hour = int(time_str.split(":")[0])
                active_hours[commit_date].add(hour)
                events[commit_date][hour].append(
                    {
                        "type": "commit",
                        "title": commit.get("message", "Commit").split("\n")[0],
                        "url": commit.get("web_url", ""),
                        "timestamp": commit.get("created_at") or commit.get("date"),
                    }
                )
            except Exception:
                pass

    return dict(counts), dict(active_hours), dict(events)


# ── Core async aggregator ──────────────────────────────────────────────────────


async def aggregate_intern_data_async(
    gl_client,
    gitlab_username: str,
    corpus_uid: str,
    intern_name: str,
    start_date: date,
    end_date: date,
    global_username: str | None = None,
    global_email: str | None = None,
) -> WeeklyActivity:
    """Aggregate all GitLab activity for one intern using GraphQL fast paths."""
    logger.debug(
        "[Aggregator] aggregate_intern_data_async: user=%s, %s → %s",
        gitlab_username, start_date, end_date,
    )
    empty = WeeklyActivity(intern_name=intern_name, gitlab_username=gitlab_username, corpus_uid=corpus_uid)

    # 1. Resolve user (GraphQL → REST fallback)
    user_obj = await users.get_user_by_username_async(gl_client, gitlab_username)
    if not user_obj or not user_obj.get("id"):
        logger.warning("[Aggregator] Could not resolve GitLab user for %s", gitlab_username)
        return empty

    user_id = user_obj["id"]
    if global_username:
        user_obj["global_username"] = global_username
    if global_email:
        user_obj["global_email"] = global_email

    # 2. Concurrently fetch projects + MRs + issues (all GraphQL → REST fallback)
    user_projects, (raw_mrs, _), (raw_issues, _) = await asyncio.gather(
        projects.get_user_projects_async(gl_client, user_id, gitlab_username),
        merge_requests.get_user_mrs_async(gl_client, user_id, username=gitlab_username),
        issues.get_user_issues_async(gl_client, user_id, username=gitlab_username),
    )
    all_projs: list[dict] = user_projects.get("all", [])
    logger.info(
        "[Aggregator] GraphQL: %d projects, %d MRs, %d issues for %s",
        len(all_projs), len(raw_mrs), len(raw_issues), gitlab_username,
    )

    # Supplement project list with any projects referenced in MRs/issues but missing from contributedProjects
    existing_pids = {p.get("id") for p in all_projs}
    for item in raw_mrs + raw_issues:
        pid = item.get("project_id")
        if pid and pid not in existing_pids:
            all_projs.append({"id": pid})
            existing_pids.add(pid)

    # 3. Timelogs — REST (GraphQL timelogs need admin scope for non-self users)
    timelogs = await fetch_user_timelogs_from_projects_async(
        gl_client, user_id, all_projs, start_date, end_date
    )
    daily_times, daily_categorized, seen_iss, seen_mrs, activity_timestamps = aggregate_daily_time_categorized(
        timelogs, raw_issues, raw_mrs
    )
    daily_times, daily_categorized = build_daily_time_from_time_stats(
        raw_issues,
        raw_mrs,
        gl_client,
        start_date.isoformat(),
        end_date.isoformat(),
        existing_daily_times=daily_times,
        existing_categorized=daily_categorized,
        issue_formal_totals=seen_iss,
        mr_formal_totals=seen_mrs,
    )
    logger.info("[Aggregator] Timelogs: %d entries, daily_times=%s", len(timelogs), daily_times)

    # 4. Commits — REST async (same path as the batch commits stream)
    since_str = (start_date - timedelta(days=1)).isoformat()
    until_str = (end_date + timedelta(days=1)).isoformat()
    all_commits, _, _ = await commits.get_user_commits_async(
        gl_client, user_obj, all_projs, since=since_str, until=until_str
    )
    logger.info("[Aggregator] Fetched %d commits for %s", len(all_commits or []), gitlab_username)

    # 5. Bucket everything into per-date slots
    start_date_str = start_date.isoformat()
    end_date_str = end_date.isoformat()

    mr_counts, mr_hours, mr_events = _bucket_mrs(raw_mrs, start_date_str, end_date_str)
    issue_counts, issue_hours, issue_events = _bucket_issues(raw_issues, start_date_str, end_date_str)
    commit_counts, commit_hours, commit_events = _bucket_commits(all_commits or [], start_date_str, end_date_str)

    all_dates: set[str] = set()
    all_dates.update(daily_times.keys())
    all_dates.update(mr_counts.keys())
    all_dates.update(issue_counts.keys())
    all_dates.update(commit_counts.keys())

    daily_data: dict[str, DailyData] = {}
    total_weekly_time = 0

    for date_str in sorted(all_dates):
        combined_hours: set[int] = set()
        combined_hours.update(mr_hours.get(date_str, set()))
        combined_hours.update(issue_hours.get(date_str, set()))
        combined_hours.update(commit_hours.get(date_str, set()))

        combined_events: dict[int, list[EventDetail]] = defaultdict(list)
        for hr, ev_list in mr_events.get(date_str, {}).items():
            combined_events[hr].extend(ev_list)
        for hr, ev_list in issue_events.get(date_str, {}).items():
            combined_events[hr].extend(ev_list)
        for hr, ev_list in commit_events.get(date_str, {}).items():
            combined_events[hr].extend(ev_list)

        cats = daily_categorized.get(date_str, {})
        day_timestamps = [ts for ts in activity_timestamps if ts.startswith(date_str)]

        gitlab_data: GitLabDailyData = {
            "mrs": mr_counts.get(date_str, 0),
            "issues": issue_counts.get(date_str, 0),
            "commits": commit_counts.get(date_str, 0),
            "time_spent_seconds": daily_times.get(date_str, 0),
            "mrs_open_time": cats.get("mrs_open", 0),
            "mrs_merged_time": cats.get("mrs_merged", 0),
            "issues_open_time": cats.get("issues_open", 0),
            "issues_closed_time": cats.get("issues_closed", 0),
            "active_hours": sorted(combined_hours),
            "activity_timestamps": day_timestamps,
            "events_by_hour": dict(combined_events),
        }
        daily_data[date_str] = DailyData(gitlab=gitlab_data, corpus={"audio_urls": []})
        total_weekly_time += daily_times.get(date_str, 0)

    logger.debug("[Aggregator] Done for %s, total_weekly_time=%d", intern_name, total_weekly_time)
    return WeeklyActivity(
        intern_name=intern_name,
        gitlab_username=gitlab_username,
        corpus_uid=corpus_uid,
        daily_data=daily_data,
        total_weekly_time=total_weekly_time,
    )


# ── Sync wrappers (keep the router unchanged) ──────────────────────────────────


def aggregate_intern_data(
    gl_client,
    gitlab_username: str,
    corpus_uid: str,
    intern_name: str,
    start_date: date,
    end_date: date,
    override_email: str | None = None,
    override_username: str | None = None,
    global_username: str | None = None,
    global_email: str | None = None,
) -> WeeklyActivity:
    """Sync entry point — delegates to aggregate_intern_data_async via the global bridge loop."""
    return run_on_loop(
        aggregate_intern_data_async(
            gl_client,
            gitlab_username=gitlab_username,
            corpus_uid=corpus_uid,
            intern_name=intern_name,
            start_date=start_date,
            end_date=end_date,
            global_username=global_username or override_username,
            global_email=global_email or override_email,
        ),
        timeout=120,
    )


async def aggregate_batch_interns_async(
    gl_client,
    intern_rows: list[dict[str, str]],
    start_date: date,
    end_date: date,
) -> list[WeeklyActivity]:
    """Aggregate activity for multiple interns concurrently via asyncio.gather."""
    commits.clear_commit_cache()
    tasks = [
        aggregate_intern_data_async(
            gl_client,
            gitlab_username=row.get("gitlab_username", ""),
            corpus_uid=row.get("corpus_username", ""),
            intern_name=row.get("name", "") or row.get("gitlab_username", ""),
            start_date=start_date,
            end_date=end_date,
            global_username=row.get("global_username"),
            global_email=row.get("global_email"),
        )
        for row in intern_rows
        if row.get("gitlab_username", "").strip()
    ]
    return list(await asyncio.gather(*tasks))


def aggregate_batch_interns(
    gl_client,
    intern_rows: list[dict[str, str]],
    start_date: date,
    end_date: date,
) -> list[WeeklyActivity]:
    """Sync entry point for batch aggregation — runs all interns concurrently."""
    return run_on_loop(
        aggregate_batch_interns_async(gl_client, intern_rows, start_date, end_date),
        timeout=300,
    )
