from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
for candidate in (ROOT, SRC):
    value = str(candidate)
    if value not in sys.path:
        sys.path.insert(0, value)

from internship_activity_tracker.application.seed_service import DEFAULT_BATCH_NAME, seed_frontend_csvs
from internship_activity_tracker.infrastructure.database import get_session, init_db


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed backend SQLite DB from frontend CSV assets.")
    parser.add_argument(
        "--assets-dir",
        default=str(ROOT.parent / "team_standup_tracker" / "public" / "assets"),
        help="Path containing interns.csv, teams.csv, and team_members.csv",
    )
    parser.add_argument(
        "--batch-name",
        default=DEFAULT_BATCH_NAME,
        help="Batch name to create or reuse for the imported seed data",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    assets_dir = Path(args.assets_dir).resolve()
    init_db()
    with get_session() as session:
        stats = seed_frontend_csvs(
            session,
            assets_dir=assets_dir,
            batch_name=args.batch_name,
        )
    print(
        "\n".join(
            [
                f"assets_dir={assets_dir}",
                f"batch_name={args.batch_name}",
                f"batch_created={stats.batch_created}",
                f"users_created={stats.users_created}",
                f"users_reused={stats.users_reused}",
                f"teams_created={stats.teams_created}",
                f"teams_reused={stats.teams_reused}",
                f"memberships_created={stats.memberships_created}",
                f"memberships_reused={stats.memberships_reused}",
                f"memberships_skipped={stats.memberships_skipped}",
            ]
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
