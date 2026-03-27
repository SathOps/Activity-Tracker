# Team Standup Tracker User Manual

## Table of Contents

1. Introduction
2. What the Application Does
3. System Requirements
4. Installation and Setup
5. Configuration
6. Running the Application
7. User Workflow
8. Feature Reference
9. Seed CSV Files
10. Verification Rules
11. API Integration Reference
12. Troubleshooting
13. FAQ
14. Maintenance Commands

---

## 1. Introduction

Team Standup Tracker is a React + TypeScript web application used to:

- log in to Swecha Corpus
- search and add interns
- organize interns into teams
- verify standup audio submissions for selected dates
- view daily and weekly team completion status

This app is a frontend management layer. It reads metadata from Corpus APIs and does not upload audio files.

---

## 2. What the Application Does

The app has three tabs after login:

- `Interns`: search Corpus users and add them to your working intern list
- `Team Dashboard`: create/manage teams and verify standup uploads
- `Status`: view daily and weekly summary dashboards for all teams

On login, it also tries to preload interns and teams from:

- `public/assets/interns.csv`
- `public/assets/teams.csv`
- `public/assets/team_members.csv`

---

## 3. System Requirements

- Node.js `20+`
- npm
- Network access to the Corpus API
- Valid Corpus user credentials (phone number + password)

---

## 4. Installation and Setup

Clone and install:

```bash
git clone <your-repository-url>
cd team_standup_tracker
npm install
```

---

## 5. Configuration

Create a `.env` file (or set environment variables in your shell).

### Required/Optional Variables

- `SWECHA_API_BASE_URL`
  - Used by Vite dev proxy (`npm run dev`)
  - Default: `https://api.corpus.swecha.org`
- `VITE_SWECHA_API_BASE_URL`
  - Optional browser-side fallback base URL
  - Default: `https://api.corpus.swecha.org`
- `CORPUS_TOKEN` (optional)
  - Auto-injected by dev proxy only if request has no `Authorization` header
  - Not used for `/api/v1/auth/*` login requests
- `VITE_STANDUP_LABEL_ALIASES` (optional)
  - Extra aliases for standup label/category matching
- `VITE_INTERNSHIP_LABEL_ALIASES` (optional)
  - Extra aliases for internship label/tag matching

Example:

```env
SWECHA_API_BASE_URL=https://api.corpus.swecha.org
VITE_SWECHA_API_BASE_URL=https://api.corpus.swecha.org
CORPUS_TOKEN=
VITE_STANDUP_LABEL_ALIASES=standup,stand-up
VITE_INTERNSHIP_LABEL_ALIASES=internship,intern
```

---

## 6. Running the Application

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 7. User Workflow

1. Open the app in browser.
2. Log in using:
   - 10-digit phone number
   - password
3. Go to `Interns` tab:
   - search by intern name
   - click `Add` to add interns into working list
4. Go to `Team Dashboard`:
   - create teams
   - add interns from the working list into teams
   - choose verification date
   - click `Verify Team`
5. Check each team/intern status and open audio previews.
6. Go to `Status` tab for daily/weekly summary view.

---

## 8. Feature Reference

### 8.1 Login and Session

- Login endpoint: `/api/v1/auth/login`
- Phone validation: exactly 10 digits
- Login tries two phone formats automatically:
  - `+91XXXXXXXXXX`
  - `XXXXXXXXXX`
- Access token is stored in browser localStorage.
- Logout clears token, username, preloaded teams, and session UI state.

### 8.2 Interns Tab

- Debounced search (`300ms`) via `/api/v1/users/search?query=...`
- Add interns to local working list
- Remove interns from working list
- Search/filter added interns by ID or name

### 8.3 Team Dashboard Tab

- Create team
- Rename team
- Delete team
- Add intern to team from working intern list
- Prevent same intern from being in multiple teams
- Verify team for selected date
- View per-intern qualified upload count
- Expand intern row to view matched audio entries and play audio

### 8.4 Status Tab

- Inline team status dashboard
- Daily status view:
  - per-team progress
  - pending summary
- Weekly status view:
  - Monday-Sunday day-wise completion
  - pending-day details
  - total remaining standups
- `Refresh` button reloads summary from live Corpus data

---

## 9. Seed CSV Files

These files are loaded after successful login.

### 9.1 `public/assets/interns.csv`

Required header:

```csv
intern_id,intern_name
```

Rules:

- duplicate `intern_id` rows are ignored (first kept)
- blank IDs are ignored
- if name is empty, ID is used as fallback name

### 9.2 `public/assets/teams.csv`

Supported headers:

- `team_id`, `team_name` (preferred)
- `teamid`, `teamname` (also accepted)

### 9.3 `public/assets/team_members.csv`

Supported headers:

- `team_id` or `team_name`
- `intern_id` or `student_name`

Rules:

- a row is skipped if team info and intern info are both incomplete
- intern matching is attempted by:
  - `intern_id`
  - `student_name` against intern name
  - `student_name` against intern ID

---

## 10. Verification Rules

An audio is counted as valid only when:

1. It matches standup aliases, and
2. It matches internship aliases, and
3. The matched alias for standup and internship are not the same token, and
4. It was uploaded on the selected date (if date filter is set)

Team completion rule in dashboard:

- team is marked `COMPLETED` when total valid uploads for selected date is `>= 4`
- otherwise team is `PENDING`

Intern completion in team cards:

- `COMPLETED` if intern has at least one valid upload for selected date
- `PENDING` otherwise

---

## 11. API Integration Reference

The app uses these backend routes:

- `POST /api/v1/auth/login`
- `GET /api/v1/users/search?query=<text>`
- `GET /api/v1/users/{internId}`
- `GET /api/v1/users/{internId}/contributions/audio`
- `GET /api/v1/records/{recordId}/record-url`

In local development, `/api/*` goes through Vite proxy.
In Vercel production, `/api/*` is rewritten to `https://api.corpus.swecha.org/api/*`.

---

## 12. Troubleshooting

### 12.1 Login Fails

- Confirm phone number is 10 digits.
- Confirm credentials are correct.
- Check API base URL and network connectivity.

### 12.2 No Interns in Search Results

- Verify token is present after login.
- Check browser devtools for `/api/v1/users/search` response.
- Confirm the user exists in Corpus.

### 12.3 Team Verification Shows Zero

- Verify audio labels/tags include standup + internship values.
- Set `VITE_STANDUP_LABEL_ALIASES` and `VITE_INTERNSHIP_LABEL_ALIASES` if backend uses alternate label names/IDs.
- Confirm upload date matches selected verification date.

### 12.4 Seed Data Not Loading

- Ensure CSV files exist under `public/assets/`.
- Ensure header names are correct.
- Ensure CSV content is valid text (not HTML/error payload).

### 12.5 Audio Does Not Play

- Some items need URL resolution through `record-url` API.
- Check if record URL API is reachable and returns playable URL.
- Check browser autoplay/network restrictions.

---

## 13. FAQ

### Can I add interns without CSV seed files?

Yes. Seed CSVs are optional; you can add interns manually through search.

### Can an intern be assigned to multiple teams?

No. The UI prevents adding an intern to more than one team.

### Is data persisted to a backend database from this app?

No app-owned database is used here. The app fetches from Corpus APIs and keeps UI state in-memory/local browser session.

### What happens if I change the verification date?

Team/intern verification state is reset and must be re-verified for the new date.

### Is `CORPUS_TOKEN` mandatory?

No. Normal login-based bearer token flow works without it.

---

## 14. Maintenance Commands

```bash
npm run lint
npm run format:check
npm run format
npm run test
npm run test:coverage
npx tsc -b
```
