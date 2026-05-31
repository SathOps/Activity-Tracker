from dataclasses import dataclass, field
from typing import Any, NotRequired, TypedDict


class EventDetail(TypedDict):
    type: str
    title: str
    url: str
    timestamp: NotRequired[str]


class GitLabDailyData(TypedDict):
    mrs: int
    issues: int
    commits: int
    time_spent_seconds: int
    mrs_open_time: int
    mrs_merged_time: int
    issues_open_time: int
    issues_closed_time: int
    active_hours: list[int]
    activity_timestamps: NotRequired[list[str]]
    events_by_hour: dict[int, list[EventDetail]]


class CorpusDailyData(TypedDict):
    audio_urls: list[dict[str, Any]]


class DailyData(TypedDict):
    gitlab: GitLabDailyData
    corpus: CorpusDailyData


@dataclass
class WeeklyActivity:
    intern_name: str
    gitlab_username: str
    corpus_uid: str
    daily_data: dict[str, DailyData] = field(default_factory=dict)
    total_weekly_time: int = 0
    audio_fetched: bool = False


class InternCSVRow(TypedDict):
    """Row shape used for CSV bulk-import and roster service helpers."""

    team_name: str
    name: str
    corpus_username: str
    gitlab_username: str
    global_username: str
    global_email: str
    date_of_joining: str
    institution_name: str
    # optional / enriched fields
    phase_name: NotRequired[str]  # e.g. "Phase 1" — which phase to place the user in
    email: NotRequired[str]
    institution_id: NotRequired[str]
    role: NotRequired[str]
    id: NotRequired[int]
    batch_name: NotRequired[str]
    override_email: NotRequired[str | None]
    override_username: NotRequired[str | None]


def parse_intern_csv(csv_content: bytes) -> list[InternCSVRow]:
    """Parse a CSV file into a list of InternCSVRow dicts.

    Column headers are matched case-insensitively via alias lists so
    slightly-different column names in exported spreadsheets still work.
    """
    import csv
    import io

    # Decode and handle BOM if present
    content = csv_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))

    # Map input columns to our standardised keys (case-insensitive)
    cols = reader.fieldnames or []
    mapping: dict[str, str] = {}

    # Aliases for each canonical field
    aliases: dict[str, list[str]] = {
        "team_name": ["team name", "team_name", "team"],
        "name": ["name", "full name", "fullname", "full_name", "display name", "display_name"],
        "corpus_username": ["corpus_username", "corpus username", "corpus uid", "corpus_uid", "corpus"],
        "gitlab_username": ["gitlab_username", "gitlab username", "username", "user", "gitlab user"],
        "global_username": ["global_username", "global username", "global user"],
        "global_email": ["global_email", "global email", "global mail"],
        "date_of_joining": ["date_of_joining", "date of joining", "doj", "joining date", "joining_date"],
        "institution_name": [
            "institution_name",
            "institution name",
            "institution",
            "college name",
            "college",
            "university",
        ],
        "phase_name": ["phase_name", "phase name", "phase"],
        "email": ["email", "corpus email", "mail"],
        "institution_id": ["institution_id", "institution id"],
        "role": ["role"],
    }

    for f_key, field_aliases in aliases.items():
        for col in cols:
            if col.strip().lower() in field_aliases:
                mapping[f_key] = col
                break

    rows: list[InternCSVRow] = []
    for row in reader:
        parsed: InternCSVRow = {
            "team_name": row.get(mapping.get("team_name", ""), "").strip(),
            "name": row.get(mapping.get("name", ""), "").strip(),
            "corpus_username": row.get(mapping.get("corpus_username", ""), "").strip(),
            "gitlab_username": row.get(mapping.get("gitlab_username", ""), "").strip(),
            "global_username": row.get(mapping.get("global_username", ""), "").strip(),
            "global_email": row.get(mapping.get("global_email", ""), "").strip(),
            "date_of_joining": row.get(mapping.get("date_of_joining", ""), "").strip(),
            "institution_name": row.get(mapping.get("institution_name", ""), "").strip(),
        }
        # Optional fields — only set if present in CSV
        for opt in ("phase_name", "email", "institution_id", "role"):
            if mapping.get(opt):
                parsed[opt] = row.get(mapping[opt], "").strip()

        # Only include rows that have at least one meaningful identifier
        if parsed["gitlab_username"] or parsed["corpus_username"] or parsed["name"]:
            rows.append(parsed)
    return rows
