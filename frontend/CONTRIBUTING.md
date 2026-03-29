# Contributing

## Overview

This project is a Vite + React + TypeScript frontend for managing interns, grouping them into teams, and verifying standup audio submissions against the Swecha Corpus backend.

Core areas in the codebase:

- `src/App.tsx`: login flow, session persistence, CSV preload, app shell
- `src/components/`: intern search, dashboards, team list, audio playback
- `src/services/corpus/`: Corpus API client and runtime configuration
- `src/utils/verification/`: standup verification logic
- `src/utils/parse*.ts`: CSV parsing for interns and seeded teams
- `tests/`: unit tests for parsing, state behavior, verification, and Corpus service parsing

For end-user behavior and workflows, see `docs/USER_MANUAL.md`.

## Prerequisites

- Node.js 20 or newer
- npm

## Installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Optional local environment variables:

```env
SWECHA_API_BASE_URL=https://api.corpus.swecha.org
VITE_SWECHA_API_BASE_URL=https://api.corpus.swecha.org
CORPUS_TOKEN=your_optional_token
VITE_STANDUP_LABEL_ALIASES=standup,stand-up
VITE_INTERNSHIP_LABEL_ALIASES=internship,intern
```

Notes:

- In local development, browser requests use relative `/api/...` routes through the Vite proxy in `vite.config.ts`.
- `CORPUS_TOKEN` is used by the local proxy only when an outgoing request has no `Authorization` header.
- In production on Vercel, `/api/*` is rewritten using `vercel.json`.
- `npm install` runs `prepare`, which configures Git to use the committed hooks in `.githooks/`.

## Local Development

Start local dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Quality Checks

Run tests:

```bash
npm test
```

Run test coverage:

```bash
npm run test:coverage
```

Coverage policy:

- `npm run test:coverage` enforces 100% statements, branches, functions, and lines for the repo's executable TypeScript modules under `src/modules/`, `src/services/`, `src/store/`, and `src/utils/`

Run linting:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Apply formatting:

```bash
npm run format
```

Type-check:

```bash
npx tsc -b
```

Recommended pre-push validation:

```bash
npm run format:check
npm run lint
npx tsc -b
npm test
```

Installed Git hooks:

- `pre-commit`: runs staged-file formatting plus ESLint autofix on staged JS/TS files, then restages the changes
- `pre-push`: runs `npm run validate`

If hooks are not active in an existing clone, run:

```bash
npm run prepare
```

## Contribution Workflow

1. Create a branch from the latest `main`.
2. Make focused changes.
3. Keep generated and local cache artifacts out of commits.
4. Run quality checks locally.
5. Submit a merge request with:
   - clear summary
   - validation steps
   - screenshots for UI changes (when applicable)

## Commit Message Convention

Use semantic commit messages:

```text
<type>: <short summary>
```

Common types:

- `feat`: new feature
- `fix`: bug fix
- `chore`: tooling, config, maintenance
- `docs`: documentation only
- `refactor`: code restructuring without behavior change
- `test`: test updates or additions
- `style`: formatting/non-functional style changes

## Changelog Process

- Update `CHANGELOG.md` for any user-visible or contributor-relevant change.
- Add changes under `## [Unreleased]` in the appropriate section (`Added`, `Changed`, `Fixed`, `Removed`).
- Move unreleased entries into a version section during release.

## Code Guidelines

- Use TypeScript throughout.
- Follow the existing ESLint and Prettier configuration.
- Prefer small, isolated changes.
- Add/update tests when behavior changes in parsing, verification, state handling, or API parsing.
- Keep architecture boundaries:
  - UI in `src/components/`
  - API interaction in `src/services/`
  - reusable parsing/verification in `src/utils/`

## CI

GitLab CI currently runs:

- `npm run test:coverage`
- `npm run build`

Run lint, format checks, and type checks locally before opening an MR.

## Do Not Commit

Do not commit generated or local-only artifacts such as:

- `builds/`
- `cache/`
- `coverage/`
- `dist/`
- local environment files (`.env`, `.env.*`)

## Merge Request Checklist

- [ ] Changes are scoped to the task
- [ ] `npm run format:check` passes
- [ ] `npm run lint` passes
- [ ] `npx tsc -b` passes
- [ ] `npm test` passes
- [ ] Tests were added/updated where behavior changed
- [ ] Generated files and caches are not included
- [ ] `CHANGELOG.md` updated (if applicable)
