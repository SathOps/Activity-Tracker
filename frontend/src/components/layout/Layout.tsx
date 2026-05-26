import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { Sidebar } from './Sidebar';
import { useConfigStore } from '../../stores/configStore';
import { Alert } from '../ui/Alert';

interface Props {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = 'standup_theme_mode';

type ThemeMode = 'light' | 'dark';

const MODE_META = {
  standup: {
    section: 'Standup Tracker',
    title: 'Standup Tracker',
    description:
      'Manage daily standup submissions, verification, audio evidence, and team progress.',
  },
  profile: {
    section: 'Git Compliance Checker',
    title: 'User Profile',
    description:
      'Developer activity, merge requests, issues, and contribution summary.',
  },
  weekly: {
    section: 'Git Compliance Checker',
    title: 'Weekly Performance',
    description: 'Track daily activity patterns and weekly consistency.',
  },
  batch: {
    section: 'Git Compliance Checker',
    title: 'Batch Analytics',
    description: 'Review activity and progress across multiple developers.',
  },
  leaderboard: {
    section: 'Git Compliance Checker',
    title: 'Team Leaderboard',
    description: 'Compare team performance, scoring, and contribution trends.',
  },
  roster: {
    section: 'Git Compliance Checker',
    title: 'Roster Management',
    description: 'Manage team composition, groups, and batch membership.',
  },
} as const;

export function Layout({ children }: Props) {
  const { t } = useTranslation();
  const { gitlabToken, activeMode, corpusUser } = useConfigStore();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    readStoredThemeMode()
  );
  const modeMeta = MODE_META[activeMode] ?? MODE_META.standup;
  const corpusUserLabel = corpusUser.trim();
  const isStandupMode = activeMode === 'standup';

  useEffect(() => {
    persistThemeMode(themeMode);

    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <header className="mb-6 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Internship Activity Tracker
                </p>
                <h1 className="text-2xl font-bold text-slate-900">
                  {modeMeta.section}
                </h1>
                <p className="max-w-3xl text-sm text-slate-500">
                  {modeMeta.description}
                </p>
                {!isStandupMode ? (
                  <div className="pt-2">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      Current view: {modeMeta.title}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                {isStandupMode ? <LanguageSwitcher /> : null}
                {isStandupMode ? (
                  <button
                    aria-label={t('theme.switchMode', {
                      mode:
                        themeMode === 'dark'
                          ? t('theme.light')
                          : t('theme.dark'),
                    })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base text-slate-600 transition-colors hover:bg-slate-100"
                    onClick={() =>
                      setThemeMode((prev) =>
                        prev === 'dark' ? 'light' : 'dark'
                      )
                    }
                    type="button"
                  >
                    <span aria-hidden="true">
                      {themeMode === 'dark' ? '☀' : '☾'}
                    </span>
                  </button>
                ) : null}
                {corpusUserLabel ? (
                  <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                    Corpus: {corpusUserLabel}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {!isStandupMode && !gitlabToken && (
            <Alert
              variant="warning"
              title="GitLab Token Required"
              className="mb-6"
            >
              Enter your GitLab Personal Access Token in the sidebar to get
              started. Go to <strong>GitLab → Settings → Access Tokens</strong>{' '}
              and create a token with at least{' '}
              <code className="bg-amber-100 px-1 rounded text-xs">
                read_api
              </code>{' '}
              scope.
            </Alert>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return 'light';
}

function persistThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}
