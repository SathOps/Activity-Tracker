# Activity Tracker

A full-stack platform for tracking and verifying intern daily activities, standup audio submissions, and team performance, integrated with the Swecha Corpus backend.

## 📁 Repository Structure

```
Activity-Tracker/
├── backend/      # FastAPI + SQLite + SQLAlchemy API service
└── frontend/     # React + Vite+ + TypeScript dashboard application
```

## 🚀 Quick Start

### Backend (FastAPI)
```bash
cd backend
# Create virtual environment and install dependencies
uv sync  # or python3 -m venv .venv && pip install -e ".[dev]"
# Start backend API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Frontend (React + TypeScript)
```bash
cd frontend
# Install dependencies
npm install
# Start dev server
npm run dev
```
Application will be available at [http://localhost:5173](http://localhost:5173).

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite+, i18next (trilingual: English, Telugu, Hindi)
- **Backend**: FastAPI, SQLAlchemy 2.0, SQLite, Pydantic, Python 3.13+
- **Integrations**: Swecha Corpus API, GitLab API
