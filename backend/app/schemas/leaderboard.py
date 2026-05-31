"""
Pydantic schemas for the /api/leaderboard router.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# ── Team data models ──────────────────────────────────────────────────────────


class TeamMember(BaseModel):
    username: str = Field(..., description="GitLab username of the team member.")


class Team(BaseModel):
    """Mirrors the team dict shape stored in data/teams.json."""

    team_name: str = Field(..., description="Unique team display name.")
    project_name: str = Field(default="", description="Associated project name or path (informational).")
    members: List[TeamMember] = Field(default=[], description="List of team members.")
    scope: str = Field(
        default="all",
        description="'all' = visible on the global leaderboard. 'specific' = scoped team.",
    )


class LeaderboardAnalyzeRequest(BaseModel):
    """Trigger analysis for one or more teams."""

    teams: List[Team] = Field(..., description="Teams to analyse.", min_length=1)
    since: Optional[str] = Field(
        default=None,
        description="ISO 8601 start date e.g. '2025-01-01T00:00:00Z'.",
    )
    until: Optional[str] = Field(
        default=None,
        description="ISO 8601 end date e.g. '2025-12-31T23:59:59Z'.",
    )


# ── Responses ─────────────────────────────────────────────────────────────────


class MemberRow(BaseModel):
    """Per-member stats row — mirrors _extract_member_row() output."""

    username: str
    status: str
    total_commits: int = 0
    morning_commits: int = 0
    afternoon_commits: int = 0
    mr_created: int = 0
    mr_merged: int = 0
    mr_open: int = 0
    mr_closed: int = 0
    mr_assigned: int = 0
    issues_raised: int = 0
    issues_closed: int = 0
    issues_assigned: int = 0
    groups: int = 0
    score: int = 0
    error: Optional[str] = None

    class Config:
        extra = "allow"


class TeamTotals(BaseModel):
    """Aggregated totals across all members — mirrors _aggregate_team_totals()."""

    total_commits: int = 0
    morning_commits: int = 0
    afternoon_commits: int = 0
    mr_created: int = 0
    mr_merged: int = 0
    mr_open: int = 0
    mr_closed: int = 0
    mr_assigned: int = 0
    issues_raised: int = 0
    issues_closed: int = 0
    issues_assigned: int = 0
    team_score: int = 0


class TeamResult(BaseModel):
    """Analysis result for a single team."""

    team_name: str
    project_name: str
    members: List[MemberRow]
    totals: TeamTotals


class LeaderboardAnalyzeResponse(BaseModel):
    teams: List[TeamResult]


class TeamsListResponse(BaseModel):
    teams: List[Dict[str, Any]]
