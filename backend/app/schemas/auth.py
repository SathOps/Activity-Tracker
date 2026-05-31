from pydantic import BaseModel, Field


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
