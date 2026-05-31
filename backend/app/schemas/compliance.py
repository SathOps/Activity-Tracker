from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    connected: bool
    gitlab_url: str
    role: str = "intern"
    user: dict[str, Any] | None = None


class GitlabStatusResponse(BaseModel):
    status: str
    connected: bool
    gitlab_url: str
    user: dict[str, Any] | None = None
    profile: dict[str, Any] | None = None


class UserProfileEnvelope(BaseModel):
    user: dict[str, Any] = Field(default_factory=dict)
    projects_count: int = 0
    groups_count: int = 0
    open_merge_requests: int = 0
    open_issues: int = 0
    issues_details: dict[str, Any] = Field(default_factory=dict)
    issues_list: list[dict[str, Any]] = Field(default_factory=list)
    profile_readme: dict[str, Any] = Field(default_factory=dict)
