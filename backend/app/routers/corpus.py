from __future__ import annotations

import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Form, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db
from internship_activity_tracker.infrastructure.models import User

router = APIRouter(tags=["MockCorpus"])

# In-memory store for user uploaded mock standups
MOCK_UPLOADS: list[dict[str, Any]] = []


def hash_string(s: str) -> int:
    """Helper to generate a deterministic integer from a string."""
    return int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16)


def get_deterministic_mock_audios(username: str) -> list[dict[str, Any]]:
    """Generate 30 days of deterministic mock standup audio records for a user."""
    audios = []
    today = datetime.now()
    compliance_rating = hash_string(username) % 100

    slots = [
        {"id": "S1", "good": "03:45:00Z", "late": "04:45:00Z"},
        {"id": "S2", "good": "06:45:00Z", "late": "07:45:00Z"},
        {"id": "S3", "good": "08:45:00Z", "late": "09:45:00Z"},
        {"id": "S4", "good": "11:15:00Z", "late": "11:45:00Z"},
    ]

    # Generate records going back 30 days
    for i in range(30):
        d = today - timedelta(days=i)
        date_key = d.strftime("%Y-%m-%d")

        for slot in slots:
            rand_val = (hash_string(f"{username}-{date_key}-{slot['id']}") % 100) / 100.0

            # Determine probability thresholds based on complianceRating
            good_prob = 0.75
            late_prob = 0.15
            if compliance_rating >= 85:
                good_prob = 0.95
                late_prob = 0.04
            elif 10 <= compliance_rating < 40:
                good_prob = 0.50
                late_prob = 0.25
            elif compliance_rating < 10:
                good_prob = 0.20
                late_prob = 0.30

            if rand_val < good_prob:
                audios.append({
                    "id": f"{username}-{date_key}-{slot['id']}",
                    "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                    "category": "standup",
                    "tag": "internship",
                    "labels": ["standup", "internship"],
                    "uploaded_at": f"{date_key}T{slot['good']}"
                })
            elif rand_val < (good_prob + late_prob):
                audios.append({
                    "id": f"{username}-{date_key}-{slot['id']}",
                    "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                    "category": "standup",
                    "tag": "internship",
                    "labels": ["standup", "internship"],
                    "uploaded_at": f"{date_key}T{slot['late']}"
                })

    return audios


@router.get("/proxy/api/v1/categories/")
def get_categories():
    """Mock endpoint for category listing."""
    return [
        {
            "id": "c81f5d73-9090-453e-bb08-c2f46453e0bd",
            "name": "standup",
            "title": "Standup",
            "description": "Daily standup updates",
            "approved": True
        },
        {
            "id": "4dd053f4-6323-43d4-87a3-ce1816bd9459",
            "name": "internship",
            "title": "Internship",
            "description": "Internship activity updates",
            "approved": True
        }
    ]


@router.post("/location/verify-location")
def verify_location(body: dict[str, Any]):
    """Mock endpoint for location reverse-geocoding/verification."""
    lat = body.get("latitude", 17.4483)
    lng = body.get("longitude", 78.3741)
    return {
        "formatted_address": "Swecha Office, Hyderabad, Telangana, India",
        "country": "India",
        "state": "Telangana",
        "city": "Hyderabad",
        "postal_code": "500032",
        "latitude": lat,
        "longitude": lng
    }


@router.post("/records/upload/chunk")
def upload_chunk():
    """Mock endpoint for uploading standup audio chunks."""
    return {"status": "success"}


@router.post("/records/upload")
def finalize_upload(
    upload_uuid: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    category_ids: str = Form(...),
    user_id: str = Form(...),
    media_type: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    total_chunks: str = Form(...),
    filename: str = Form(...),
    release_rights: str = Form(...),
    language: str = Form(...),
):
    """Mock endpoint to finalize multi-chunk standup audio upload."""
    record_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Save the upload to in-memory list so it is returned by contributions endpoint
    MOCK_UPLOADS.append({
        "id": record_id,
        "user_id": user_id,
        "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "category": "standup",
        "tag": "internship",
        "labels": ["standup", "internship"],
        "uploaded_at": now_iso,
        "title": title,
        "description": description
    })
    
    return {"status": "success", "id": record_id}


@router.get("/proxy/api/v1/auth/me")
def get_auth_me(db: Session = Depends(get_db)):
    """Mock endpoint to get current authenticated user's profile info."""
    user = db.scalar(select(User).where(User.corpus_username == "mock_admin"))
    if user:
        return {
            "id": user.corpus_username,
            "username": user.corpus_username,
            "name": user.name,
            "email": user.email or "mock_admin@example.com",
            "phone": "9876543000",
            "institution_id": "1",
            "college_name": "Mock Institution",
            "roles": [{"name": user.role}]
        }
    return {
        "id": "mock_admin",
        "username": "mock_admin",
        "name": "Mock Admin",
        "email": "mock_admin@example.com",
        "phone": "9876543000",
        "institution_id": "1",
        "college_name": "Mock Institution",
        "roles": [{"name": "admin"}]
    }


@router.get("/proxy/api/v1/users/search")
def search_users(query: str = Query(default=""), db: Session = Depends(get_db)):
    """Mock endpoint to search interns in the database by query."""
    if not query.strip():
        return []
        
    search_pattern = f"%{query}%"
    users = db.scalars(
        select(User)
        .where(
            User.name.like(search_pattern) | 
            User.corpus_username.like(search_pattern)
        )
        .limit(20)
    ).all()
    
    return [
        {
            "id": u.corpus_username,
            "username": u.corpus_username,
            "name": u.name,
            "email": u.email or f"{u.corpus_username}@example.com",
            "phone": "9876543210"
        }
        for u in users
    ]


@router.get("/proxy/api/v1/users/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Mock endpoint to fetch details of a specific user."""
    user = db.scalar(select(User).where(User.corpus_username == user_id))
    if not user and user_id.isdigit():
        user = db.get(User, int(user_id))
        
    if user:
        return {
            "id": user.corpus_username,
            "username": user.corpus_username,
            "name": user.name,
            "email": user.email or f"{user.corpus_username}@example.com",
            "phone": "9876543210",
            "institution_id": user.institution_id or "1",
            "college_name": user.institution_name or "Mock Institution"
        }
    
    return {
        "id": user_id,
        "username": user_id,
        "name": user_id.title(),
        "email": f"{user_id}@example.com",
        "phone": "9876543210",
        "institution_id": "1",
        "college_name": "Mock Institution"
    }


@router.get("/proxy/api/v1/users/{user_id}/contributions/audio")
def get_user_audios(user_id: str, db: Session = Depends(get_db)):
    """Mock endpoint to return deterministic and newly uploaded standup records for a user."""
    user = db.scalar(select(User).where(User.corpus_username == user_id))
    if not user and user_id.isdigit():
        user = db.get(User, int(user_id))
        
    username = user.corpus_username if user else user_id
    
    audios = get_deterministic_mock_audios(username)
    
    # Append any uploaded standup audio files during runtime
    for upload in MOCK_UPLOADS:
        if upload["user_id"] == username or upload["user_id"] == user_id:
            audios.append({
                "id": upload["id"],
                "file_url": upload["file_url"],
                "category": upload["category"],
                "tag": upload["tag"],
                "labels": upload["labels"],
                "uploaded_at": upload["uploaded_at"]
            })
            
    return {"records": audios}


@router.get("/proxy/api/v1/records/{record_id}/record-url")
def get_record_url(record_id: str):
    """Mock endpoint to return the audio source URL for playback."""
    return {
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    }
