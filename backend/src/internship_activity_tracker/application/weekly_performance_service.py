from __future__ import annotations

from datetime import date, timedelta

from fastapi import HTTPException, status

from app.schemas.weekly_performance import CorpusDailyData, DailyData, GitLabDailyData, WeeklyActivityResponse
from internship_activity_tracker.application import user_service
from internship_activity_tracker.infrastructure.corpus.client import CorpusClient
from internship_activity_tracker.services.weekly_performance.aggregator import aggregate_batch_interns, aggregate_intern_data


def parse_date(date_str: str, field_name: str) -> date:
    try:
        return date.fromisoformat(date_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"'{field_name}' must be a valid ISO date string (YYYY-MM-DD). Got: '{date_str}'",
        )


def activity_to_response(activity) -> WeeklyActivityResponse:
    daily = {}
    for date_str, day in activity.daily_data.items():
        gitlab = day.get("gitlab", {}) if isinstance(day, dict) else day["gitlab"]
        corpus = day.get("corpus", {}) if isinstance(day, dict) else day["corpus"]
        events = gitlab.get("events_by_hour", {}) if isinstance(gitlab, dict) else {}
        events_str = {str(key): value for key, value in events.items()}
        daily[date_str] = {
            "gitlab": {
                "mrs": gitlab.get("mrs", 0) if isinstance(gitlab, dict) else gitlab["mrs"],
                "issues": gitlab.get("issues", 0) if isinstance(gitlab, dict) else gitlab["issues"],
                "commits": gitlab.get("commits", 0) if isinstance(gitlab, dict) else gitlab["commits"],
                "time_spent_seconds": gitlab.get("time_spent_seconds", 0) if isinstance(gitlab, dict) else gitlab["time_spent_seconds"],
                "mrs_open_time": gitlab.get("mrs_open_time", 0) if isinstance(gitlab, dict) else gitlab.get("mrs_open_time", 0),
                "mrs_merged_time": gitlab.get("mrs_merged_time", 0) if isinstance(gitlab, dict) else gitlab.get("mrs_merged_time", 0),
                "issues_open_time": gitlab.get("issues_open_time", 0) if isinstance(gitlab, dict) else gitlab.get("issues_open_time", 0),
                "issues_closed_time": gitlab.get("issues_closed_time", 0) if isinstance(gitlab, dict) else gitlab.get("issues_closed_time", 0),
                "active_hours": gitlab.get("active_hours", []) if isinstance(gitlab, dict) else gitlab["active_hours"],
                "activity_timestamps": gitlab.get("activity_timestamps", []) if isinstance(gitlab, dict) else [],
                "events_by_hour": events_str,
            },
            "corpus": {
                "audio_urls": corpus.get("audio_urls", []) if isinstance(corpus, dict) else corpus["audio_urls"],
            },
        }

    return WeeklyActivityResponse(
        intern_name=activity.intern_name,
        gitlab_username=activity.gitlab_username,
        corpus_uid=activity.corpus_uid,
        daily_data=daily,  # type: ignore[arg-type]
        total_weekly_time=activity.total_weekly_time,
        audio_fetched=activity.audio_fetched,
    )


def get_single_weekly_activity(current_user, client, corpus_token: str | None, *, start_date: str | None, end_date: str | None) -> WeeklyActivityResponse:
    today = date.today()
    start = parse_date(start_date, "start_date") if start_date else today - timedelta(days=7)
    end = parse_date(end_date, "end_date") if end_date else today
    if start > end:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="start_date must be on or before end_date.")

    gitlab_username = (current_user.gitlab_username or "").strip()
    if not gitlab_username:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Your profile doesn't have a GitLab username set. Please update it via PATCH /api/me before fetching weekly performance.",
        )

    activity = aggregate_intern_data(
        gl_client=client,
        gitlab_username=gitlab_username,
        corpus_uid=current_user.corpus_username,
        intern_name=current_user.name,
        start_date=start,
        end_date=end,
        global_username=current_user.global_username,
        global_email=current_user.global_email,
    )
    response = activity_to_response(activity)

    if corpus_token and current_user.corpus_username:
        try:
            corpus_client = CorpusClient()
            corpus_client.token = corpus_token
            records = corpus_client.fetch_records(
                current_user.corpus_username,
                start_date=start.isoformat(),
                end_date=end.isoformat(),
            )
            audio_entries = corpus_client.extract_all_media(records)
            for entry in audio_entries.get("audio", []):
                date_str = (entry.get("published_date") or entry.get("created_at", ""))[:10]
                if date_str and date_str in response.daily_data:
                    response.daily_data[date_str].corpus.audio_urls.append(entry)
                elif date_str:
                    response.daily_data[date_str] = DailyData(
                        gitlab=GitLabDailyData(),
                        corpus=CorpusDailyData(audio_urls=[entry]),
                    )
            response.audio_fetched = True
        except Exception:
            pass

    return response


def get_batch_weekly_activity(session, actor, client, interns: list, *, start_date: str, end_date: str, allowed_usernames: list[str] | None) -> list[WeeklyActivityResponse]:
    start = parse_date(start_date, "start_date")
    end = parse_date(end_date, "end_date")
    if start > end:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="start_date must be on or before end_date.")

    allowed = set(allowed_usernames) if allowed_usernames is not None else None
    filtered_interns = [
        intern for intern in interns if allowed is None or intern.gitlab_username in allowed
    ]

    intern_rows = []
    for intern in filtered_interns:
        global_email = intern.global_email
        global_username = intern.global_username
        if not (global_email or global_username):
            user = user_service.get_user_by_username(session, intern.gitlab_username)
            if user:
                global_email = (user.get("global_email") or "").strip() or None
                global_username = (user.get("global_username") or "").strip() or None
        intern_rows.append(
            {
                "gitlab_username": intern.gitlab_username,
                "corpus_username": intern.corpus_username or "",
                "name": intern.name or intern.gitlab_username,
                "global_username": global_username,
                "global_email": global_email,
            }
        )

    results = aggregate_batch_interns(
        gl_client=client,
        intern_rows=intern_rows,  # type: ignore[arg-type]
        start_date=start,
        end_date=end,
    )
    return [activity_to_response(activity) for activity in results]
