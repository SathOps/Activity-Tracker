from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from internship_activity_tracker.application.auth_service import sync_user_from_corpus
from internship_activity_tracker.application.batch_service import create_batch
from internship_activity_tracker.application.team_service import create_my_team, create_team, join_team, leave_team
from internship_activity_tracker.application.user_service import set_self_batch
from internship_activity_tracker.infrastructure.database import Base
from internship_activity_tracker.infrastructure.models import TeamMembership, User


def make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def test_corpus_sync_defaults_to_intern():
    session = make_session()
    user = sync_user_from_corpus(
        session,
        {
            "username": "alice",
            "full_name": "Alice",
            "email": "alice@example.com",
            "institution_id": "1",
            "institution_name": "Swecha",
        },
    )
    assert user.role == "intern"


def test_corpus_sync_promotes_admin():
    session = make_session()
    user = sync_user_from_corpus(
        session,
        {
            "username": "admin-user",
            "full_name": "Admin User",
            "roles": ["admin"],
        },
    )
    assert user.role == "admin"


def test_intern_can_choose_batch_and_move_between_teams():
    session = make_session()
    admin = User(name="Admin", corpus_username="admin", role="admin")
    session.add(admin)
    session.flush()

    batch = create_batch(session, admin, name="Batch A", start_date="2026-01-01", end_date="2026-12-31")
    intern = sync_user_from_corpus(session, {"username": "intern1", "full_name": "Intern One"})
    set_self_batch(session, intern, batch["id"])

    team_one = create_my_team(session, intern, name="Team One", batch_id=batch["id"])
    team_two = create_team(session, admin, name="Team Two", batch_id=batch["id"])
    join_team(session, intern, team_two["id"])
    leave_team(session, intern, team_two["id"])

    memberships = session.query(TeamMembership).filter(TeamMembership.user_id == intern.id).all()
    assert len(memberships) == 2
    assert session.get(User, intern.id).team_id is None
