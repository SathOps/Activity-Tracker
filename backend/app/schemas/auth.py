from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.roster import UserRecord


class CorpusLoginRequest(BaseModel):
    phone: str
    password: str


class CorpusProfile(BaseModel):
    corpus_username: str
    name: str
    email: str = ""
    institution_id: str = ""
    institution_name: str = ""


class CorpusLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str = ""
    username: str
    phone: str = ""
    roles: list[str] = Field(default_factory=list)
    profile: CorpusProfile


class SessionResponse(BaseModel):
    authenticated: bool = False
    gitlab_connected: bool = False
    needs_profile_setup: bool = False
    needs_batch_selection: bool = False
    user: Optional[UserRecord] = None
