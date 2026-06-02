from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from internship_activity_tracker.application.seed_service import DEFAULT_BATCH_NAME, seed_frontend_csvs
from internship_activity_tracker.infrastructure.database import Base
from internship_activity_tracker.infrastructure.models import Batch, Team, TeamMembership, User


def make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def write_csv(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def test_seed_frontend_csvs_is_idempotent(tmp_path: Path):
    assets_dir = tmp_path / "assets"
    assets_dir.mkdir()
    write_csv(
        assets_dir / "interns.csv",
        "intern_id,intern_name\nalice,Alice\nbob,Bob\nalice,Alice Duplicate\n",
    )
    write_csv(
        assets_dir / "teams.csv",
        "team_id,team_name\ncore,Core\ntrinity,Trinity\n",
    )
    write_csv(
        assets_dir / "team_members.csv",
        "team_id,intern_id,student_name\ncore,alice,Alice\ntrinity,,Bob\ncore,missing,Missing\n",
    )

    session = make_session()

    first = seed_frontend_csvs(session, assets_dir=assets_dir, batch_name=DEFAULT_BATCH_NAME)
    second = seed_frontend_csvs(session, assets_dir=assets_dir, batch_name=DEFAULT_BATCH_NAME)

    assert first.batch_created is True
    assert first.users_created == 2
    assert first.teams_created == 2
    assert first.memberships_created == 2
    assert first.memberships_skipped == 1

    assert second.batch_created is False
    assert second.users_created == 0
    assert second.users_reused == 2
    assert second.teams_created == 0
    assert second.teams_reused == 2
    assert second.memberships_created == 0
    assert second.memberships_reused == 2
    assert second.memberships_skipped == 1

    assert session.scalar(select(Batch).where(Batch.name == DEFAULT_BATCH_NAME)) is not None
    assert session.query(User).count() == 2
    assert session.query(Team).count() == 2
    assert session.query(TeamMembership).count() == 2
    assert session.scalar(select(User).where(User.corpus_username == "alice")).team.name == "Core"
    assert session.scalar(select(User).where(User.corpus_username == "bob")).team.name == "Trinity"
