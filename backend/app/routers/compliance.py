from fastapi import APIRouter, Depends
from fastapi import Query

from app.dependencies import get_gitlab_client
from app.schemas.compliance import UserProfileEnvelope
from internship_activity_tracker.application import compliance_service

router = APIRouter(tags=["Compliance"])


@router.get("/users/{username}/profile", response_model=UserProfileEnvelope)
def get_user_compliance_profile(username: str, client=Depends(get_gitlab_client)):
    return UserProfileEnvelope(**compliance_service.get_gitlab_profile(client, username))


@router.get("/users/{username}/commits")
def get_user_compliance_commits(
    username: str,
    since: str | None = Query(default=None),
    until: str | None = Query(default=None),
    project_ids: str | None = Query(default=None),
    client=Depends(get_gitlab_client),
):
    parsed_project_ids = [int(item) for item in project_ids.split(",") if item.strip()] if project_ids else None
    return compliance_service.get_user_commits(client, username, since=since, until=until, project_ids=parsed_project_ids)
