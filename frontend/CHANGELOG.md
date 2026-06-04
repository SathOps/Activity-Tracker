# Changelog

All notable changes to this project should be documented in this file.

The format is based on Keep a Changelog, and this project follows a simple release history based on repository milestones.

## [Unreleased]

### Added

- Dead code detection tool Knip for identifying unused files, exports, and dependencies
- Comprehensive user manual at `docs/USER_MANUAL.md` covering setup, workflows, CSV seed formats, verification rules, API endpoints, troubleshooting, and FAQ
- ESLint and Prettier project tooling
- `lint`, `format`, and `format:check` npm scripts
- contribution guide for local development and project workflow
- repo-managed Git hooks for pre-commit staged formatting/linting and commit-time full validation
- `scripts/updateChangelog.js` plus `npm run changelog` (auto mode) and `npm run changelog:update` (manual mode) to append notes to the changelog without manual edits
- i18n infrastructure with `i18next`, `react-i18next`, and browser language detection
- Locale resource files for English (`en`), Telugu (`te`), and Hindi (`hi`) under `src/i18n/locales/`
- `scripts/validateI18n.mjs` and `npm run validate:i18n` to enforce translation key consistency and non-empty values
- Toolbar language switcher with globe button (`🌐`), dropdown language options, selected-language checkmark, outside-click close, and Escape-key close behavior

### Changed

- Repositioned Step 2 back button beside progress indicators to prevent header collisions
- Removed duplicate headers and outer card styling containers from the dashboard layout to simplify and natively integrate the standup workspace dashboard
- Moved the mobile/desktop bottom navigation element inside the main container to avoid flex conflicts and adjusted its positioning to center correctly next to the sidebar on desktop
- Imported missing `styles.css` stylesheet in `main.tsx` to load custom sidebar and bottom navigation styles
- Implemented two-step profile completion wizard and stabilized mobile onboarding screen heights
- Bypassed batch selection and profile setup redirects during local development.
- Updated `src/components/auth/CorpusLoginPage.tsx` CSS for mobile view.
- Updated `src/components/auth/CorpusLoginPage.tsx`, `src/styles.css`
- Migrated DashboardLayout to use Tailwind CSS utility classes
- Fully migrated ProfileCompletionPage and MyProfilePage to Tailwind CSS utility classes
- Fully migrated CorpusLoginPage to Tailwind CSS utility classes and removed corresponding custom styles
- Migrate login and batch selection layouts to Tailwind CSS and clean up styles
- Updated GitLab CI/CD pipeline and package.json scripts with Knip validation
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
- Pre-commit workflow now runs staged-file autofixes and then full validation (`format:check`, `lint`, `typecheck`, `validate:i18n`, and tests)
- Added `npm run changelog` command to auto-generate changelog entries from local changed files when no manual message is provided
- Pre-commit workflow now conditionally runs i18n validation when locale JSON files are staged before running the existing staged checks
- Dashboard home tabs now prioritize `Status` by rendering it first in the tab row and setting it as the default active view after login
- Seed CSV intern identifiers were normalized across `public/assets/interns.csv` and `public/assets/team_members.csv` (including `kaveri1` and `pavani_pothuganti_5305`) to keep preload mapping consistent
- `package-lock.json` metadata refreshed with npm peer flags (`"peer": true`) on dependency entries

### Fixed

- Updated `ests/corpusService.test.ts`
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
