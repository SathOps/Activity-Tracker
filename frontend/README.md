# Team Standup Tracker

> A client-side management dashboard for tracking daily standup audio submissions from interns, integrated with the **Swecha Corpus** backend.

---

## 📘 User Manual

For complete end-to-end usage instructions, see **[User Manual](docs/USER_MANUAL.md)**.

---

## 📌 Overview

**Team Standup Tracker** is a React + TypeScript web application that provides a management layer over the Swecha Corpus backend. It organizes interns into teams and verifies whether required standup audio submissions have been uploaded under specific corpus categories — all without duplicating or permanently storing corpus data locally.

The app communicates with Corpus APIs in real time, keeping all state in-memory or in `localStorage`. It is deployed on **Vercel** and uses a development-time proxy (`vite-plus`) to route `/api/*` requests to the Corpus backend.

---

## 🎯 Objectives

- Search and add interns to a working list via the Corpus API.
- Dynamically create, rename, and delete teams; assign interns to teams.
- Verify standup audio submissions automatically against configurable rules.
- Ensure each intern has uploaded at least **four audio files** categorized under **standup + internship** labels.
- Provide daily and weekly status views with per-slot compliance tracking.
- Offer analytics with team activity heatmaps and filtered leaderboards.

---

## 🚀 Features

### Authentication & Session

- Phone number + password login via `POST /api/v1/auth/login`.
- Session persisted in `localStorage` with automatic token injection.
- Profile display with logout and theme/language preferences.

### Intern Management

- Search interns by name through the Corpus API (`/api/v1/users/search`).
- Preload interns from CSV seed data (`public/assets/interns.csv` — 40 interns).
- Add/remove interns from the working list.
- Filter interns by name or verification status (all / verified / unverified).

### Team Management

- Create, rename, and delete teams (15 pre-seeded teams from CSV).
- Assign interns to teams from the working list (an intern can belong to only one team).
- Per-team verification with expandable intern cards.
- Team CSV preload with cross-referenced member assignments.

### Standup Verification

- **4 daily time slots** with specific windows and late cutoffs:

  | Slot | Window      | Late Cutoff |
  | ---- | ----------- | ----------- |
  | S1   | 09:00–09:30 | 10:00       |
  | S2   | 12:00–12:30 | 13:00       |
  | S3   | 14:00–14:30 | 15:00       |
  | S4   | 16:30–17:00 | 17:30       |

- Each upload is classified as **GOOD** (on-time), **DELAYED** (late), or **MISSING**.
- An audio counts as valid only if it matches **both** a "standup" label **and** an "internship" label (with configurable aliases via `VITE_CORPUS_LABEL_ALIASES`).
- Date matching based on the selected verification date.

### Status Dashboard

- **Daily view**: team completion status, pending summaries, progress bars.
- **Weekly view**: 7-day rolling compliance overview.
- Date navigation with today/week selector.
- Retry logic with exponential backoff (3 attempts, fail-fast).

### Analytics Dashboard

- **29-day trailing activity heatmap** showing team upload frequency.
- **Filtered team rankings** by Good / Delayed / Missing counts.
- **Leaderboard scoring**: `good × 2 + delayed × 1`, with tie-breaking by fewer delays.
- Quality metrics per team (completion %, average slots filled).

### Audio Playback & Recording

- Custom audio player with play/pause, 10s skip forward/back, and seek bar.
- **Record Standup Modal**: browser `MediaRecorder` with start/pause/resume/stop/cancel.
- **Upload form**: title, description, language selector (23 Indian languages), location (device GPS or presets for Swecha/IIIT Hyderabad), category display.
- **Chunked upload** with retry, exponential backoff, and progress tracking (5MB chunks, 10MB max file size, 10s minimum duration).

### Internationalization (i18n)

- Full trilingual support: **English**, **Telugu** (తెలుగు), **Hindi** (हिन्दी).
- ~230 translation keys per locale covering all UI namespaces.
- Browser language detection with `localStorage` persistence.
- Language switcher in the toolbar with native-language labels.

### Theming

- **Light** and **Dark** themes via CSS custom properties.
- Persisted to `localStorage` with `data-theme` attribute.
- Typography: Space Grotesk (headings) + IBM Plex Sans (body).

---

## 🧱 Architecture

```
┌─────────────────────────────────────┐
│        Browser (React + TS)         │
│                                     │
│  App.tsx ── Auth + Shell            │
│  DashboardLayout.tsx ── Main UI     │
│  teamStore.ts ── In-memory state    │
│  corpusService.ts ── API client     │
│  corpusUploadApi.ts ── Upload logic │
│  analyticsService.ts ── Rankings    │
│  verifyStandup.ts ── Verification   │
│  i18n/ ── en / te / hi              │
└──────────────┬──────────────────────┘
               │ HTTP (Bearer token)
               ▼
┌─────────────────────────────────────┐
│      Swecha Corpus Backend           │
│                                     │
│  /api/v1/auth/login                 │
│  /api/v1/users/search               │
│  /api/v1/users/me                   │
│  /api/v1/records/user/{userId}      │
│  /api/v1/records/upload/chunk       │
│  /api/v1/records/upload             │
│  /api/v1/categories/                │
│  /api/v1/location/verify-location   │
└─────────────────────────────────────┘
```

**Key design decisions:**

- **No local database** — all data is fetched from Corpus APIs on demand.
- **In-memory `Map`-based store** (`teamStore.ts`) for team state.
- **Vite dev proxy** routes `/api/*` to Corpus API with automatic Bearer token injection.
- **Vercel rewrites** (`vercel.json`) proxy `/api/*` to `https://api.corpus.swecha.org/api/*` in production.
- **Pure business logic** layers (`teamManager.ts`, `verifyStandup.ts`, `standupSlots.ts`) fully unit-tested.

---

## ⚙️ Workflow

1. User logs in with phone number and password.
2. App preloads interns, teams, and team-member assignments from CSV seed files.
3. User searches and adds interns to the working list.
4. User creates teams and assigns interns.
5. App queries Corpus API for each intern's audio metadata.
6. Verification engine filters audios by standup + internship labels and selected date.
7. Dashboard displays per-slot compliance (GOOD / DELAYED / MISSING) and team status.
8. Analytics view provides 29-day heatmaps and leaderboards.

---

## 🛠️ Tech Stack

| Layer                   | Technology                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| **Frontend**            | React 18, TypeScript                                              |
| **Build tool**          | Vite+ (`vite-plus`)                                               |
| **Styling**             | Plain CSS with custom properties (light/dark themes)              |
| **State**               | In-memory `Map` store, `localStorage` for session/theme/language  |
| **i18n**                | `i18next` + `react-i18next` + `i18next-browser-languagedetector`  |
| **Testing**             | Vitest + `@vitest/coverage-v8`                                    |
| **Linting**             | OXC (`vp lint`) with TypeScript, Unicorn, React, jsx-a11y plugins |
| **Formatting**          | oxlint (`vp fmt`)                                                 |
| **Dead-code detection** | Knip                                                              |
| **Deployment**          | Vercel                                                            |
| **CI/CD**               | GitLab CI (Node 22)                                               |

---

## 📂 Project Structure

```
├── .githooks/                  # Git hooks (pre-commit validation, no-op pre-push)
├── docs/
│   └── USER_MANUAL.md          # Complete end-user documentation
├── public/assets/              # CSV seed data (40 interns, 15 teams, 40 assignments)
│   ├── interns.csv
│   ├── teams.csv
│   └── team_members.csv
├── scripts/
│   ├── setupGitHooks.mjs       # Configures git core.hooksPath on install
│   ├── updateChangelog.js      # Appends entries to CHANGELOG.md (--auto mode)
│   ├── validateI18n.mjs        # Validates translation key consistency across locales
│   ├── validateI18nUsage.mjs   # Detects hardcoded UI strings in JSX
│   └── validateStaged.mjs      # Runs lint+fix on staged files
├── src/
│   ├── App.tsx                 # Root: auth, shell, CSV preload, theme, toolbar
│   ├── main.tsx                # Entry: wraps App in I18nextProvider
│   ├── styles.css              # Full CSS (~1612 lines, light/dark themes)
│   ├── components/
│   │   ├── audio/
│   │   │   └── StandupAudioPlayer.tsx    # Custom player with skip/seek
│   │   ├── dashboard/
│   │   │   ├── DashboardHome.tsx         # Tab router (Status/Interns/Teams/Analytics)
│   │   │   ├── DashboardLayout.tsx       # Main dashboard logic (~2294 lines)
│   │   │   ├── InternsDashboard.tsx      # Intern list + search panel
│   │   │   ├── TeamList.tsx              # Team cards with intern dropdowns
│   │   │   └── TeamsDashboard.tsx        # Wraps DashboardLayout with mode
│   │   ├── intern/
│   │   │   ├── InternCard.tsx            # Intern detail with audio expansion
│   │   │   └── InternSearch.tsx          # Corpus API search with debounce
│   │   ├── LanguageSwitcher.tsx          # Globe button with en/te/hi dropdown
│   │   ├── RecordStandupModal.tsx        # Modal for recording + uploading
│   │   ├── StandupAudioRecorder.tsx      # Browser MediaRecorder wrapper
│   │   └── StandupUploadForm.tsx         # Upload form with location/categories
│   ├── hooks/
│   │   ├── useCorpusUpload.ts            # Chunked upload with retry/backoff
│   │   └── useRecorder.ts                # MediaRecorder hook with timer
│   ├── i18n/
│   │   ├── i18n.ts                       # i18next init with language detector
│   │   └── locales/
│   │       ├── en.json                   # English translations (~230 keys)
│   │       ├── hi.json                   # Hindi translations
│   │       └── te.json                   # Telugu translations
│   ├── modules/teams/
│   │   ├── teamManager.ts                # Pure team CRUD operations
│   │   └── teamManager.test.ts
│   ├── scripts/
│   │   └── verifyIntern.ts               # CLI script for single-intern verification
│   ├── services/
│   │   ├── analytics/
│   │   │   ├── analyticsService.ts       # Leaderboard/analytics row builders
│   │   │   └── index.ts
│   │   ├── corpus/
│   │   │   ├── corpusService.ts          # Corpus API client (search, audios)
│   │   │   └── index.ts
│   │   └── corpusUploadApi.ts            # Chunked upload, location verify, categories
│   ├── store/
│   │   └── teamStore.ts                  # In-memory Map-based team store
│   ├── types/
│   │   └── corpusUpload.ts               # TypeScript interfaces for upload
│   └── utils/
│       ├── parseInternsCSV.ts            # Parse interns.csv
│       ├── parseTeamSeedCSV.ts           # Parse teams.csv + team_members.csv
│       ├── timestamps.ts                 # Date/timestamp parsing utilities
│       └── verification/
│           ├── index.ts
│           ├── standupSlots.ts           # 4 daily slot definitions (S1–S4)
│           └── verifyStandup.ts          # Standup audio validation logic
├── tests/                        # Unit tests (161 tests, 100% coverage)
├── .gitlab-ci.yml                # CI/CD pipeline (quality → i18n → test → build)
├── .nvmrc                        # Node.js version pin (22)
├── knip.json                     # Dead-code detection config
├── vercel.json                   # Production API rewrites
└── vite.config.ts                # Vite+ lint, format, test, server config
```

---

## ▶️ Setup & Development

### Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **npm** (lockfile is `package-lock.json`; Bun lockfile also present)

### Installation

```bash
npm install
```

The `prepare` script automatically configures Git hooks (`.githooks/pre-commit`).

### Development

```bash
npm run dev
```

The dev server proxies `/api/*` to the Swecha Corpus backend and injects the Bearer token from your stored session.

### Environment Variables

| Variable                    | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `SWECHA_API_BASE_URL`       | API base URL for the Vite dev proxy                                     |
| `VITE_SWECHA_API_BASE_URL`  | Browser-runtime API base URL                                            |
| `CORPUS_TOKEN`              | Optional; only for proxy-injected auth in local dev                     |
| `VITE_CORPUS_LABEL_ALIASES` | Optional; comma-separated label aliases for standup/internship matching |

See [`.env.example`](.env.example) for the template.

### Production Build

```bash
npm run build
npm run preview
```

### Vercel Deployment

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` rewrites `/api/*` to `https://api.corpus.swecha.org/api/*`

---

## 🧪 Testing & Quality

### Test Suite

```bash
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage (100% threshold enforced)
```

**161 tests** across 11 test files covering:

- Team store and manager
- Corpus service (search, audio fetching)
- Analytics service (leaderboards, heatmaps, quality metrics)
- Standup verification and slot logic
- CSV parsing (interns, teams, members)
- Corpus upload API (chunked upload, retries, error classification, location verification)
- Barrel exports verification

Coverage threshold: **100%** for statements, branches, functions, and lines on all modules under `src/modules/`, `src/services/`, `src/store/`, and `src/utils/`.

### Quality Checks

```bash
npm run format:check   # oxlint format check
npm run lint           # OXC lint (TypeScript, Unicorn, React, jsx-a11y)
npm run typecheck      # TypeScript type checking via vp
npm run knip           # Dead-code detection
```

### i18n Validation

```bash
npm run validate:i18n         # Key consistency across en/te/hi
npm run validate:i18n:usage   # Detect hardcoded UI strings in JSX
```

### Git Hooks

- **pre-commit**: runs `validate:staged` (format fix + re-stage) followed by full `validate` (lint + i18n + tests).
- **pre-push**: no-op.

---

## 🔌 Corpus API Endpoints

| Endpoint                           | Method | Purpose                            |
| ---------------------------------- | ------ | ---------------------------------- |
| `/api/v1/auth/login`               | POST   | Authenticate with phone + password |
| `/api/v1/users/me`                 | GET    | Fetch current user profile         |
| `/api/v1/users/search`             | POST   | Search interns by name             |
| `/api/v1/records/user/{userId}`    | GET    | Fetch audio records for a user     |
| `/api/v1/records/upload/chunk`     | POST   | Upload a single chunk              |
| `/api/v1/records/upload`           | POST   | Finalize multi-chunk upload        |
| `/api/v1/categories/`              | GET    | Fetch available categories         |
| `/api/v1/location/verify-location` | POST   | Reverse geocode coordinates        |

---

## 🔧 Scripts Reference

| Script                        | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `npm run dev`                 | Start Vite+ dev server with API proxy             |
| `npm run build`               | Production build to `dist/`                       |
| `npm run preview`             | Preview production build locally                  |
| `npm run lint`                | Lint all files with OXC                           |
| `npm run format`              | Format all files with oxlint                      |
| `npm run format:check`        | Check formatting (CI)                             |
| `npm run typecheck`           | TypeScript type checking                          |
| `npm run test`                | Run test suite                                    |
| `npm run test:watch`          | Watch mode testing                                |
| `npm run test:coverage`       | Test with coverage enforcement                    |
| `npm run validate`            | Full validation: lint + i18n + tests              |
| `npm run validate:staged`     | Lint + fix staged files                           |
| `npm run validate:i18n`       | Validate translation key parity                   |
| `npm run validate:i18n:usage` | Check for hardcoded UI strings                    |
| `npm run i18n:replace`        | Alias for i18n usage validation                   |
| `npm run knip`                | Dead-code detection                               |
| `npm run knip:fix`            | Auto-fix dead code issues                         |
| `npm run knip:strict`         | Strict dead-code scan (exports, files, deps)      |
| `npm run changelog`           | Auto-generate changelog from staged/changed files |
| `npm run changelog:update`    | Manual changelog entry                            |

---

## 📊 CI/CD Pipeline

The GitLab CI pipeline (`.gitlab-ci.yml`) runs four stages on Node 22:

| Stage       | Jobs                                               |
| ----------- | -------------------------------------------------- |
| **quality** | `format:check`, `lint`, `typecheck`, `knip`        |
| **i18n**    | `validate:i18n`, `i18n:replace`                    |
| **test**    | `test:coverage` (Cobertura report, 100% threshold) |
| **build**   | `build` (artifacts: `dist/`)                       |

All jobs are interruptible and cache npm dependencies via `.npm/`.

---

## 📈 Future Enhancements

- Automatic daily verification scheduler / cron jobs.
- Team-level analytics with exportable reports (CSV/PDF).
- Notification system for pending or delayed submissions.
- AI-based audio validation (speech detection, transcription).
- Bulk intern import/export.
- Role-based access (admin vs. team lead views).

---

## 📄 License

This project is developed for internship and educational purposes.
