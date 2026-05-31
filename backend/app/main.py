from __future__ import annotations

import logging
import os
import sys

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional at import time
    def load_dotenv(*_args, **_kwargs):
        return False
from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_SRC_DIR = os.path.join(_BACKEND_DIR, "src")
for _path in (_BACKEND_DIR, _SRC_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

load_dotenv(os.path.join(_BACKEND_DIR, ".env"))

from app.dependencies import get_current_user, get_gitlab_identity
from app.routers import auth, batch, batches, compliance, leaderboard, me, mentor_access, standup, teams, users, weekly_performance
from internship_activity_tracker.infrastructure import database as db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)

origins = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if item.strip()]

app = FastAPI(title="Internship Activity Tracker API", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.on_event("startup")
def startup_event():
    db.init_db()
    logger.info("SQLite database initialised at %s", db._DB_URL)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
    )


app.include_router(auth.router, prefix="/api")
app.include_router(me.router, prefix="/api/me")
app.include_router(batches.router, prefix="/api/batches")
app.include_router(teams.router, prefix="/api/teams")
app.include_router(users.router, prefix="/api/users")
app.include_router(mentor_access.router, prefix="/api/mentor-access")
app.include_router(standup.router, prefix="/api/standup")
app.include_router(compliance.router, prefix="/api/compliance")
app.include_router(batch.router, prefix="/api/batch")
app.include_router(leaderboard.router, prefix="/api/leaderboard")
app.include_router(weekly_performance.router, prefix="/api/weekly-performance")


@app.get("/api/health")
def health_check(
    current_user=Depends(get_current_user),  # type: ignore[name-defined]
    gitlab_user=Depends(get_gitlab_identity),  # type: ignore[name-defined]
):
    return {
        "status": "ok",
        "connected": True,
        "gitlab_url": os.getenv("GITLAB_URL", "https://code.swecha.org"),
        "role": current_user.role,
        "user": {
            "id": gitlab_user.get("id"),
            "username": gitlab_user.get("username"),
            "name": gitlab_user.get("name"),
            "avatar_url": gitlab_user.get("avatar_url"),
        },
    }


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Internship Activity Tracker API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }
