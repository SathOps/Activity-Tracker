from typing import Optional

from pydantic import BaseModel, Field


class BatchPayload(BaseModel):
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class BatchUpdatePayload(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class BatchRecord(BaseModel):
    id: int
    name: str
    date: str = ""
    start_date: str = ""
    end_date: str = ""


class BatchListResponse(BaseModel):
    batches: list[BatchRecord]


class TeamPayload(BaseModel):
    name: str
    batch_id: int


class TeamUpdatePayload(BaseModel):
    name: Optional[str] = None


class TeamRecord(BaseModel):
    id: int
    name: str
    batch_id: int
    batch_name: str = ""
    start_date: str = ""
    end_date: str = ""
    created_by: Optional[int] = None
    member_count: int = 0
    is_active: bool = True


class TeamListResponse(BaseModel):
    teams: list[TeamRecord]


class UserRecord(BaseModel):
    id: int
    name: str
    corpus_username: str
    email: str = ""
    institution_id: str = ""
    institution_name: str = ""
    gitlab_username: str = ""
    global_username: str = ""
    global_email: str = ""
    date_of_joining: str = ""
    role: str
    team_id: Optional[int] = None
    team_name: str = ""
    batch_id: Optional[int] = None
    batch_name: str = ""


class UserListResponse(BaseModel):
    users: list[UserRecord]


class UserCreatePayload(BaseModel):
    name: str
    corpus_username: str
    batch_id: Optional[int] = None
    role: str = "intern"
    email: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    gitlab_username: Optional[str] = None
    global_username: Optional[str] = None
    global_email: Optional[str] = None
    date_of_joining: Optional[str] = None


class UserUpdatePayload(BaseModel):
    gitlab_username: Optional[str] = None
    global_username: Optional[str] = None
    global_email: Optional[str] = None
    date_of_joining: Optional[str] = None
    batch_id: Optional[int] = None
    team_id: Optional[int] = None
    role: Optional[str] = None


class SelfProfileUpdatePayload(BaseModel):
    gitlab_username: Optional[str] = None
    global_username: Optional[str] = None
    global_email: Optional[str] = None
    date_of_joining: Optional[str] = None


class SetBatchPayload(BaseModel):
    batch_id: int


class CreateMyTeamPayload(BaseModel):
    name: str
    batch_id: int


class TeamSelectionPayload(BaseModel):
    team_id: int


class AddTeamMemberPayload(BaseModel):
    corpus_username: str


class MentorAccessPayload(BaseModel):
    mentor_id: int
    batch_id: int


class MentorAccessRecord(BaseModel):
    id: int
    mentor_id: int
    mentor_name: str = ""
    mentor_username: str = ""
    batch_id: int
    batch_name: str = ""


class MentorAccessListResponse(BaseModel):
    assignments: list[MentorAccessRecord]


class MembershipRecord(BaseModel):
    id: int
    user_id: int
    team_id: int
    team_name: str = ""
    joined_at: str
    left_at: str = ""


class TeamDetailRecord(TeamRecord):
    users: list[UserRecord] = Field(default_factory=list)
    history: list[MembershipRecord] = Field(default_factory=list)
