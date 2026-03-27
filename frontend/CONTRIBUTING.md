# Contributing

  ## Overview

  This project is a Vite + React + TypeScript frontend for managing interns, grouping them into teams, and checking standup audio
  submissions against the Swecha Corpus backend.

  Core areas in the codebase:

  - `src/App.tsx`: login flow, session persistence, CSV preload, app shell
  - `src/components/`: intern search, dashboards, team list, audio playback
  - `src/services/corpus/`: Corpus API client and runtime configuration
  - `src/utils/verification/`: standup verification logic
  - `src/utils/parse*.ts`: CSV parsing for interns and seeded teams
  - `tests/`: unit tests for parsing, store behavior, verification, and corpus service logic

  ## Prerequisites

  - Node.js 20 or newer
  - npm

  ## Installation

  1. Clone the repository.
  2. Install dependencies:


  npm install

  3. Optional local environment variables:

  SWECHA_API_BASE_URL=https://api.corpus.swecha.org
  VITE_SWECHA_API_BASE_URL=https://api.corpus.swecha.org
  CORPUS_TOKEN=your_optional_token

  Notes:

  - In local development, browser requests use relative /api/... routes through the Vite proxy in vite.config.ts.
  - CORPUS_TOKEN is only used by the local proxy when a request does not already contain an Authorization header.
  - In production on Vercel, /api/* is rewritten using vercel.json.

  ## Usage

  Start the local development server:

  npm run dev

  Build the project:

  npm run build

  Preview the production build:

  npm run preview

  Application flow:

  1. Log in with a phone number and password.
  2. On successful login, the app preloads interns and seeded teams from:
      - public/assets/interns.csv
      - public/assets/teams.csv
      - public/assets/team_members.csv
  3. Use the Interns tab to search Corpus users and add them to the workspace.
  4. Use the Team Dashboard tab to create and manage teams.
  5. Use the Status or verification flow to check whether interns have valid standup audio submissions.

  ## Quality Checks

  Run tests:

  npm test

  Run test coverage:

  npm run test:coverage

  Run linting:

  npm run lint

  Check formatting:

  npm run format:check

  Apply formatting:

  npm run format

  Recommended pre-push validation:

  npm run format:check
  npm run lint
  npx tsc --noEmit
  npm test

  ## Contribution Workflow

  1. Create a branch from the latest main branch.
  2. Make focused changes.
  3. Keep generated and local cache artifacts out of commits.
  4. Run the quality checks locally.
  5. Submit a merge request with a clear summary, validation steps, and any relevant screenshots for UI changes.

  ## Commit Message Convention

  Use semantic commits so the history stays readable and searchable.

  Recommended format:

  <type>: <short summary>

  Common commit types:

  - feat: new feature
  - fix: bug fix
  - chore: tooling, config, maintenance
  - docs: documentation only
  - refactor: code restructuring without behavior change
  - test: test updates or additions
  - style: formatting or non-functional style-only changes

  Examples:

  feat: add team status dashboard
  fix: handle missing corpus audio metadata
  chore: set up eslint and prettier
  docs: add contributing and changelog docs
  refactor: simplify standup verification flow
  test: add coverage for team seed parsing
  style: format dashboard components

  Guidelines:

  - Keep the summary short and specific.
  - Use the imperative mood.
  - Avoid mixing unrelated changes in one commit.
  - Prefer one logical change per commit.

  ## Code Guidelines

  - Use TypeScript throughout the frontend codebase.
  - Follow the current ESLint and Prettier configuration.
  - Prefer small, isolated changes over broad refactors unless the refactor is the task.
  - Add or update tests when changing parsing, verification logic, state behavior, or API client behavior.
  - Preserve the current app architecture:
      - UI logic in src/components/
      - backend interaction in src/services/
      - reusable parsing and verification logic in src/utils/

  ## Testing Guidance

  You should add or update tests when changing:

  - CSV parsing behavior
  - standup verification rules
  - team management logic
  - corpus API response parsing

  Existing coverage areas include:

  - tests/parseInternsCSV.test.ts
  - tests/parseTeamSeedCSV.test.ts
  - tests/teamStore.test.ts
  - tests/corpusService.test.ts
  - tests/verifyStandup.test.ts
  - src/modules/teams/teamManager.test.ts

  ## CI

  GitLab CI currently runs:

  - npm run test:coverage
  - npm run build

  Contributors should still run linting, formatting, and TypeScript checks locally before opening an MR.

  ## Do Not Commit

  Do not commit generated or local-only artifacts such as:

  - builds/
  - cache/
  - coverage/
  - dist/
  - local environment files

  ## Merge Request Checklist

  - [ ] Changes are scoped to the task
  - [ ] npm run format:check passes
  - [ ] npm run lint passes
  - [ ] npx tsc --noEmit passes
  - [ ] npm test passes
  - [ ] Tests were added or updated where behavior changed
  - [ ] Generated files and caches are not included
  - [ ] Commit messages follow the semantic commit convention