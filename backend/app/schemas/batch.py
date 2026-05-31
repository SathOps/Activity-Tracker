"""
Pydantic schemas for the /api/batch router.
"""

from typing import List

from pydantic import BaseModel, Field

# ── Requests ─────────────────────────────────────────────────────────────────


class ResolveProjectsRequest(BaseModel):
    """Resolve a list of project paths (e.g. 'group/repo') to numeric IDs."""

    project_paths: List[str] = Field(
        ...,
        description="GitLab project paths to resolve.",
        min_length=1,
        examples=[["tools/gitlab-compliance-checker", "group/another-repo"]],
    )


# ── Responses ─────────────────────────────────────────────────────────────────


class ResolveProjectsResponse(BaseModel):
    resolved: List[int]
    failed: List[str]
