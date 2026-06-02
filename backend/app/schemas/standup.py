from typing import Any, Optional

from pydantic import BaseModel, Field


class StandupMember(BaseModel):
    id: int
    name: str
    corpus_username: str
    gitlab_username: str = ""


class StandupTeam(BaseModel):
    id: int
    name: str
    batch_id: int
    batch_name: str = ""
    member_count: int = 0
    members: list[StandupMember] = Field(default_factory=list)


class StandupDashboard(BaseModel):
    teams: list[StandupTeam] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)


class BatchBreakdown(BaseModel):
    batch_name: str
    team_count: int


class StandupAnalytics(BaseModel):
    scope: str = ""
    team_count: int = 0
    batch_breakdown: list[BatchBreakdown] = Field(default_factory=list)


class StandupOverview(BaseModel):
    scope: str = ""
    dashboard: StandupDashboard = Field(default_factory=StandupDashboard)
    analytics: StandupAnalytics = Field(default_factory=StandupAnalytics)
    team: Optional[dict[str, Any]] = None
    teams: list[dict[str, Any]] = Field(default_factory=list)
    users: list[dict[str, Any]] = Field(default_factory=list)


class StandupResponse(BaseModel):
    data: StandupOverview = Field(default_factory=StandupOverview)
