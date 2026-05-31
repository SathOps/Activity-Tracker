"""
SQLAlchemy engine, session factory, and declarative base.

Locked to SQLite.  The database file path can be overridden via the
SQLITE_DB_PATH environment variable (default: ./intern_tracker.db).
"""

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# ── SQLite path ───────────────────────────────────────────────────────────────

_DB_PATH: str = os.getenv("SQLITE_DB_PATH", "./intern_tracker.db")
_DB_URL: str = f"sqlite:///{_DB_PATH}"


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""

    pass


# ── Engine ────────────────────────────────────────────────────────────────────

_engine = create_engine(
    _DB_URL,
    connect_args={"check_same_thread": False},  # required for SQLite + threads
    pool_pre_ping=True,
)

_SessionFactory = sessionmaker(bind=_engine, expire_on_commit=False)


# ── Public helpers ────────────────────────────────────────────────────────────


def init_db() -> None:
    """Create all tables (idempotent — safe to call on every startup)."""
    from . import models  # noqa: F401  — registers ORM classes with Base

    Base.metadata.create_all(_engine)
    _run_sqlite_migrations()


def _table_columns(table_name: str) -> set[str]:
    with _engine.begin() as connection:
        rows = connection.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return {row[1] for row in rows}


def _add_column_if_missing(table_name: str, column_name: str, ddl: str) -> None:
    if column_name in _table_columns(table_name):
        return
    with _engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {ddl}"))


def _run_sqlite_migrations() -> None:
    _add_column_if_missing("batches", "start_date", "start_date VARCHAR")
    _add_column_if_missing("batches", "end_date", "end_date VARCHAR")


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Yield a database session with automatic commit/rollback/close."""
    session: Session = _SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
