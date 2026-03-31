# Team-wise Standup Audio Submission Checker

### Swecha Corpus Client Application

---

## 📘 User Manual

For end-to-end usage instructions, see:

- `docs/USER_MANUAL.md`

---

## 📌 Overview

The **Team-wise Standup Audio Submission Checker** is a client-side management application designed to integrate with the **Swecha Corpus backend**. The primary goal of this project is to simplify the process of organizing interns into teams and verifying whether required standup audio submissions have been uploaded under specific corpus categories.

This application acts as a management layer that fetches intern data and audio submission details directly from the Swecha Corpus system, without duplicating or permanently storing corpus data locally.

---

## 🎯 Objectives

- Provide an interface to search and add interns using their IDs.
- Dynamically create and manage teams/groups of interns.
- Verify standup audio submissions automatically.
- Ensure each intern has uploaded at least **four audio files** categorized under:
  - **Category:** standup
  - **Domain/Tag:** internship

---

## 🚀 Features

### 1. Intern Management

- Search interns using intern IDs.
- Fetch intern data from the Swecha Corpus backend.
- Add selected interns into the application workspace.

### 2. Dynamic Team Management

- Create multiple teams/groups.
- Rename teams.
- Delete teams.
- Add or remove interns from teams dynamically.
- No fixed limit on number of teams or members.

### 3. Standup Audio Verification

- Validate whether interns have uploaded required audio files.
- Automatically check:
  - Minimum 4 audio files.
  - Correct category and domain.

- Display submission status (Completed / Pending).

### 4. Backend Integration

- Real-time data fetching from Swecha Corpus APIs.
- No local duplication of audio content.
- Lightweight client-side logic for verification.

---

## 🧱 System Architecture (High-Level)

Client App (Frontend Dashboard)
│
│ API Requests
▼
Swecha Corpus Backend
│
├── Intern Search
├── Audio Metadata
└── Category Filtering

The client application serves as an interface layer that communicates with the Swecha Corpus backend to fetch interns and validate audio submissions.

---

## ⚙️ Expected Workflow

1. User searches interns by ID inside the client app.
2. The app fetches intern details from Swecha Corpus.
3. User creates teams and assigns interns.
4. The system queries Swecha Corpus APIs to fetch audio submission metadata.
5. The app verifies:
   - At least 4 audio files exist.
   - Files belong to standup + internship category.

6. Dashboard shows compliance status for each intern/team.

---

## 🛠️ Tech Stack (Suggested)

Frontend:

- React / Next.js or any modern web framework
- Tailwind CSS or Material UI

Backend (Optional Middleware if needed):

- FastAPI / Node.js Express

Integration:

- REST APIs provided by Swecha Corpus

---

## 📂 Project Structure (Example)

project-root/
│
├── frontend/
│ ├── components/
│ ├── pages/
│ ├── services/
│ └── utils/
│
├── backend/ (optional)
│ ├── api/
│ └── services/
│
├── docs/
└── README.md

---

## 🔌 Integration Details

### Intern Search

- Query Swecha Corpus API using intern ID.
- Fetch profile and metadata.

### Audio Verification

- Request audio metadata from corpus backend.
- Filter by:
  - category = "standup"
  - tag/domain = "internship"

- Count valid submissions.

---

## ▶️ Setup Instructions (Generic)

1. Clone the repository.
2. Install dependencies.

Frontend:
npm install
npm run dev

Project scripts are powered by Vite+ under the hood.

Backend (if applicable):
pip install -r requirements.txt
uvicorn main:app --reload

3. Configure environment variables:

- `SWECHA_API_BASE_URL` (used by Vite dev proxy)
- `VITE_SWECHA_API_BASE_URL` (browser runtime API base, if needed)
- `CORPUS_TOKEN` (optional; only for proxy-injected auth in local dev)

4. Vercel deployment:

- This project uses `/api/...` routes in the frontend.
- `vite.config.ts` proxy works only in local dev via `npm run dev`.
- For production, `vercel.json` rewrites `/api/*` to `https://api.corpus.swecha.org/api/*`.
- Ensure Vercel Framework Preset is **Vite**, Build Command is `npm run build`, and Output Directory is `dist`.

---

## 🧪 Usage

- Open the dashboard.
- Add interns by searching their IDs.
- Create or manage teams dynamically.
- Click "Verify Submissions" to check standup audio compliance.

---

## 🔒 Assumptions

- Swecha Corpus backend provides APIs for intern lookup and audio metadata.
- Audio files are already uploaded through Swecha Corpus platform.
- The client app performs verification only (no audio uploads).

---

## 📈 Future Enhancements

- Automatic daily verification scheduler.
- Team-level analytics dashboard.
- Notification system for pending submissions.
- AI-based audio validation (speech/text classification).

---

## 👨‍💻 Contributors

- Lakshy Yarlagadda
- Lagichetty Kushal
- Pavani Nagireddi

---

## 📄 License

This project is developed for internship and educational purposes.
