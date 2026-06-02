"""
Pydantic schemas for the /api/weekly-performance router.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# ── Sub-models ────────────────────────────────────────────────────────────────


class EventDetail(BaseModel):
    type: str = Field(..., description="'commit' | 'mr' | 'issue'")
    title: str
    url: str
    timestamp: Optional[str] = None


class GitLabDailyData(BaseModel):
    mrs: int = 0
    issues: int = 0
    commits: int = 0
    time_spent_seconds: int = 0
    mrs_open_time: int = 0
    mrs_merged_time: int = 0
    issues_open_time: int = 0
    issues_closed_time: int = 0
    active_hours: List[int] = []
    activity_timestamps: List[str] = []
    events_by_hour: Dict[str, List[Dict[str, Any]]] = {}


class CorpusDailyData(BaseModel):
    audio_urls: List[Dict[str, Any]] = []


class DailyData(BaseModel):
    gitlab: GitLabDailyData
    corpus: CorpusDailyData


# ── Main response ─────────────────────────────────────────────────────────────


class WeeklyActivityResponse(BaseModel):
    intern_name: str
    gitlab_username: str
    corpus_uid: str
    daily_data: Dict[str, DailyData] = {}
    total_weekly_time: int = 0
    audio_fetched: bool = False
    commits: List[Dict[str, Any]] = []


# ── Request ───────────────────────────────────────────────────────────────────


class WeeklyPerformanceRequest(BaseModel):
    """
    Date range is optional — defaults to the last 7 days if not provided.
    All user details are fetched from the DB using the authenticated Corpus JWT.
    """

    start_date: Optional[str] = Field(
        default=None,
        description="ISO date string e.g. '2025-05-01'. Defaults to 7 days ago.",
    )
    end_date: Optional[str] = Field(
        default=None,
        description="ISO date string e.g. '2025-05-31'. Defaults to today.",
    )
    include_commits: bool = False


class InternWeeklyRequest(BaseModel):
    gitlab_username: str
    corpus_username: Optional[str] = ""
    name: Optional[str] = ""
    global_username: Optional[str] = None
    global_email: Optional[str] = None


class BatchWeeklyRequest(BaseModel):
    interns: List[InternWeeklyRequest]
    start_date: str
    end_date: str
    include_commits: bool = False
