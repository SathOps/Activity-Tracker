# Changelog

All notable changes to this project should be documented in this file.

The format is based on Keep a Changelog, and this project follows a simple release history based on repository milestones.

## [Unreleased]

### Added

- Comprehensive user manual at `docs/USER_MANUAL.md` covering setup, workflows, CSV seed formats, verification rules, API endpoints, troubleshooting, and FAQ
- ESLint and Prettier project tooling
- `lint`, `format`, and `format:check` npm scripts
- contribution guide for local development and project workflow
- repo-managed Git hooks for pre-commit staged formatting/linting and pre-push validation
- `scripts/updateChangelog.js` plus `npm run changelog:update` to append notes to the changelog without manual edits
- i18n infrastructure with `i18next`, `react-i18next`, and browser language detection
- Locale resource files for English (`en`), Telugu (`te`), and Hindi (`hi`) under `src/i18n/locales/`
- `scripts/validateI18n.mjs` and `npm run validate:i18n` to enforce translation key consistency and non-empty values
- Toolbar language switcher with globe button (`🌐`), dropdown language options, selected-language checkmark, outside-click close, and Escape-key close behavior

### Changed

- `README.md` now links directly to the user manual for easier discoverability
- `CONTRIBUTING.md` was restructured and updated with current commands, type-check guidance (`npx tsc -b`), changelog process, and current environment variable usage
- Expanded lint coverage to source files, tests, and config files
- Expanded lint coverage to helper scripts under `scripts/`
- Standardized code formatting across the codebase
- Updated lint and format ignores to exclude generated and cache artifacts
- Expanded automated test coverage across services, utils, store, and module logic, and enforced 100% coverage thresholds for those executable TypeScript modules
- Standup slot timing now respects the on-time window end and late cutoff before assigning GOOD/DELAYED badges, ensuring missing uploads render grey and multi-word label aliases split cleanly in verification
- Dashboard status summaries now retry each intern fetch up to three times, fail fast instead of showing partial data, remove the partial-data warning, and surface a refresh error when any request still fails
- App bootstrap now initializes i18n through `I18nextProvider` in `src/main.tsx`
- User-facing UI text across app, dashboard, intern, audio, and team management components now resolves through translation keys (excluding dynamic intern names/data values)
- Pre-commit workflow now conditionally runs i18n validation when locale JSON files are staged before running the existing staged checks

### Fixed

- React hook cleanup warning in the team list component

## [1.0.0]

### Added

- Corpus login flow using phone number and password
- Intern search against the Swecha Corpus API
- Team creation and management UI
- Standup submission verification logic based on Corpus audio metadata
- Audio playback support for standup records
- CSV preload support for interns, teams, and team members
- Vite development proxy for `/api` requests
- Vercel rewrite configuration for production API routing
- Unit tests for:
  - CSV parsing
  - corpus service parsing
  - standup verification
  - team store behavior
  - team manager behavior
