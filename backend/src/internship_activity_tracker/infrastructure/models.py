"""
ORM models for the Internship Activity Tracker.

Tables
──────
  batches          — internship cohorts  (e.g. "Summer 2025")
  teams            — teams within a batch  (globally unique names)
                       • start_date / end_date track team lifetime
                       • end_date auto-set when the last member leaves
  users            — intern / mentor / admin accounts
  team_memberships — full history: which user was in which team and when
                       • joined_at / left_at track exact membership duration
                       • left_at = NULL  →  currently active in this team
                       • rows are NEVER deleted — history is permanent
  mentor_batches   — many-to-many: which batches a mentor can access
                       • rows are KEPT even if user role changes back to intern
"""

from typing import List, Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# ── Batch ─────────────────────────────────────────────────────────────────────


class Batch(Base):
    """A named internship cohort (e.g. 'Summer 2025')."""

    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    date: Mapped[Optional[str]] = mapped_column(String)  # ISO date — set once on creation, never updated
    start_date: Mapped[Optional[str]] = mapped_column(String)
    end_date: Mapped[Optional[str]] = mapped_column(String)

    teams: Mapped[List["Team"]] = relationship(back_populates="batch", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship(back_populates="batch")
    mentor_assignments: Mapped[List["MentorBatch"]] = relationship(back_populates="batch", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Batch(name='{self.name}')>"

    def __str__(self) -> str:
        return self.name


# ── Team ──────────────────────────────────────────────────────────────────────


class Team(Base):
    """
    A team within a Batch.

    Design decisions
    ────────────────
    • Team names are GLOBALLY unique — the same name cannot exist in any
      other batch or time period.  This prevents "Team A" ambiguity.
    • start_date is set on creation; end_date is NULL while the team is
      active and auto-set to today when the last member leaves.
    • created_by stores the user.id of the intern who created the team
      (plain integer — no FK to avoid circular dependency with users).
    • Old teams are NEVER deleted — their rows are preserved with end_date
      set so history queries always work.
    """

    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    start_date: Mapped[str] = mapped_column(String, nullable=False)  # ISO date
    end_date: Mapped[Optional[str]] = mapped_column(String)  # NULL = active
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # user.id (no FK — avoids circular dep)

    batch: Mapped["Batch"] = relationship(back_populates="teams")
    members: Mapped[List["User"]] = relationship(
        back_populates="team",
        foreign_keys="[User.team_id]",
    )
    memberships: Mapped[List["TeamMembership"]] = relationship(back_populates="team", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Team(name='{self.name}', batch_id={self.batch_id}, active={self.end_date is None})>"

    def __str__(self) -> str:
        return f"{self.name} ({self.batch.name if self.batch else 'No Batch'})"


# ── User ──────────────────────────────────────────────────────────────────────


class User(Base):
    """
    An intern, mentor, or admin registered in the tracker.

    Field groups
    ────────────
    Auto-filled on first Corpus login (GET /api/v1/auth/me):
        name, corpus_username, email, institution_id, institution_name

    User fills in (profile completion form):
        gitlab_username, global_username, global_email, date_of_joining

    Admin assigns:
        role, batch_id

    Intern self-service:
        team_id  — set when intern creates / joins a team
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # ── Corpus-sourced (written on first login) ───────────────────────────────
    name: Mapped[str] = mapped_column(String, nullable=False)
    corpus_username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    institution_id: Mapped[Optional[str]] = mapped_column(String, index=True)
    institution_name: Mapped[Optional[str]] = mapped_column(String)

    # ── User-provided ─────────────────────────────────────────────────────────
    gitlab_username: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    global_username: Mapped[Optional[str]] = mapped_column(String, index=True)
    global_email: Mapped[Optional[str]] = mapped_column(String, index=True)
    date_of_joining: Mapped[Optional[str]] = mapped_column(String)

    # ── Role ──────────────────────────────────────────────────────────────────
    role: Mapped[str] = mapped_column(String, nullable=False, default="intern")

    # ── Assignments ───────────────────────────────────────────────────────────
    batch_id: Mapped[Optional[int]] = mapped_column(ForeignKey("batches.id"))
    team_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teams.id"))  # current team only

    batch: Mapped[Optional["Batch"]] = relationship(back_populates="users")
    team: Mapped[Optional["Team"]] = relationship(
        back_populates="members",
        foreign_keys=[team_id],
    )
    memberships: Mapped[List["TeamMembership"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    mentor_batches: Mapped[List["MentorBatch"]] = relationship(back_populates="mentor", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(corpus_username='{self.corpus_username}', role='{self.role}')>"

    def __str__(self) -> str:
        return f"{self.name} (@{self.corpus_username})"


Member = User


# ── TeamMembership ────────────────────────────────────────────────────────────


class TeamMembership(Base):
    """
    Permanent historical record of every team a user has ever been in.

    Why this exists
    ───────────────
    users.team_id stores ONLY the current team.  When an intern moves from
    Team A → Team B, team_id is overwritten and the Team A record is lost.
    This table prevents that — every move creates a new row.

    How it works
    ────────────
    • A user joins Team A:
        INSERT (user_id, team_id=A, joined_at=today, left_at=NULL)
        UPDATE users SET team_id = A

    • User later moves to Team B:
        UPDATE team_memberships SET left_at=today WHERE user_id=X AND left_at IS NULL
        INSERT (user_id, team_id=B, joined_at=today, left_at=NULL)
        UPDATE users SET team_id = B
        -- if Team A now has 0 members: UPDATE teams SET end_date=today WHERE id=A

    • Query "who was ever in Team A?":
        SELECT * FROM team_memberships WHERE team_id = A

    • Query "where has User X been?":
        SELECT * FROM team_memberships WHERE user_id = X ORDER BY joined_at

    Invariant enforced in service code
    ───────────────────────────────────
    At most ONE row per user has left_at = NULL  (their current active team).
    """

    __tablename__ = "team_memberships"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False, index=True)
    joined_at: Mapped[str] = mapped_column(String, nullable=False)  # ISO date
    left_at: Mapped[Optional[str]] = mapped_column(String)  # NULL = currently active

    user: Mapped["User"] = relationship(back_populates="memberships")
    team: Mapped["Team"] = relationship(back_populates="memberships")

    def __repr__(self) -> str:
        status = "active" if self.left_at is None else f"left {self.left_at}"
        return f"<TeamMembership(user_id={self.user_id}, team_id={self.team_id}, {status})>"


# ── MentorBatch ───────────────────────────────────────────────────────────────


class MentorBatch(Base):
    """
    Maps a mentor to the batches they are allowed to access (many-to-many).

    Design decisions
    ────────────────
    • One row per (mentor, batch) pair.
    • Rows are KEPT even if the user's role changes back to intern — this
      preserves the historical assignment and lets admins re-promote quickly.
    • Access enforcement is done at query time: role == "mentor" AND
      batch_id IN (SELECT batch_id FROM mentor_batches WHERE mentor_id = user.id).
    """

    __tablename__ = "mentor_batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    mentor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False, index=True)

    mentor: Mapped["User"] = relationship(back_populates="mentor_batches")
    batch: Mapped["Batch"] = relationship(back_populates="mentor_assignments")

    def __repr__(self) -> str:
        return f"<MentorBatch(mentor_id={self.mentor_id}, batch_id={self.batch_id})>"

