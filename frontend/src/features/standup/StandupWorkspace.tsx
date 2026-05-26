import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardHome from '../../components/dashboard/DashboardHome';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import swechaBirdsIcon from '../../../images/swecha-birds-icon.png';
import swechaDarkLogo from '../../../images/Swecha-lite.png';
import swechaLightLogo from '../../../images/swecha-dark.png';
import type { Team } from '../../components/dashboard/TeamList';
import type { Intern } from '../../components/intern/InternSearch';
import {
  configureCorpusService,
  getCurrentUser,
  type InternSummary,
} from '../../services/corpus';
import { getCorpusApiBaseUrl } from '../../services/corpus/apiUrl';
import { useConfigStore } from '../../stores/configStore';
import { parseInternsCSV } from '../../utils/parseInternsCSV';
import {
  buildPreloadedTeams,
  parseTeamMembersCSV,
  parseTeamsCSV,
} from '../../utils/parseTeamSeedCSV';

const THEME_STORAGE_KEY = 'standup_theme_mode';

type ThemeMode = 'light' | 'dark';

const CORPUS_DEFAULT_BASE =
  getCorpusApiBaseUrl() || 'https://api.corpus.swecha.org';

export default function StandupWorkspace() {
  const { t } = useTranslation();
  const authToken = useConfigStore((state) => state.corpusToken);
  const username = useConfigStore((state) => state.corpusUser);
  const clearCorpusToken = useConfigStore((state) => state.clearCorpusToken);
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);
  const [preloadedTeams, setPreloadedTeams] = useState<Team[]>([]);
  const [userProfile, setUserProfile] = useState<InternSummary | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    readStoredThemeMode()
  );

  useEffect(() => {
    configureCorpusService({
      baseUrl: CORPUS_DEFAULT_BASE,
      useMock: false,
      authToken,
    });
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setUserProfile(null);
      return;
    }

    let isCancelled = false;
    const fallbackId = username.trim();

    const loadProfile = async () => {
      try {
        const profile = await getCurrentUser(fallbackId);
        if (!isCancelled) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to load profile details', error);
        if (!isCancelled) {
          setUserProfile(null);
        }
      }
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [authToken, username]);

  const profileDisplayName = useMemo(
    () => userProfile?.name || userProfile?.username || username.trim() || '',
    [userProfile, username]
  );

  const profileInitial = useMemo(() => {
    const trimmed = profileDisplayName.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
  }, [profileDisplayName]);

  useEffect(() => {
    persistThemeMode(themeMode);

    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const swechaLogoSrc = themeMode === 'dark' ? swechaDarkLogo : swechaLightLogo;
  const currentYear = new Date().getFullYear();

  // Preload interns and team seed data from CSV on login success
  useEffect(() => {
    if (!authToken) {
      setPreloadedTeams([]);
      return;
    }

    let isCancelled = false;

    const preloadFromCsv = async () => {
      const [internsResult, teamsResult, teamMembersResult] =
        await Promise.allSettled([
          fetchCsvText('assets/interns.csv', ['intern_id', 'intern_name']),
          fetchCsvText('assets/teams.csv', ['team_id', 'team_name']),
          fetchCsvText('assets/team_members.csv', [
            'team_id',
            'intern_id',
            'student_name',
          ]),
        ]);

      if (isCancelled) {
        return;
      }

      const preloadedInterns =
        internsResult.status === 'fulfilled'
          ? parseInternsCSV(internsResult.value)
          : [];

      if (preloadedInterns.length > 0) {
        setAddedInterns((prev) =>
          mergeInternCollections(prev, preloadedInterns)
        );
      }

      const teamRows =
        teamsResult.status === 'fulfilled'
          ? parseTeamsCSV(teamsResult.value)
          : [];
      const teamMemberRows =
        teamMembersResult.status === 'fulfilled'
          ? parseTeamMembersCSV(teamMembersResult.value)
          : [];
      setPreloadedTeams(
        buildPreloadedTeams(teamRows, teamMemberRows, preloadedInterns)
      );

      if (internsResult.status === 'rejected') {
        console.warn(
          'Could not preload interns from CSV:',
          internsResult.reason
        );
      }

      if (teamsResult.status === 'rejected') {
        console.warn('Could not preload teams from CSV:', teamsResult.reason);
      }

      if (teamMembersResult.status === 'rejected') {
        console.warn(
          'Could not preload team members from CSV:',
          teamMembersResult.reason
        );
      }
    };

    void preloadFromCsv();

    return () => {
      isCancelled = true;
    };
  }, [authToken]);

  const handleRemoveIntern = (internId: string) => {
    setAddedInterns((prev) => prev.filter((i) => i.id !== internId));
  };

  const handleLogout = () => {
    clearCorpusToken();
    setAddedInterns([]);
    setPreloadedTeams([]);
    setIsProfileMenuOpen(false);
    setUserProfile(null);
  };

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('.profile-menu-container')
      ) {
        return;
      }

      setIsProfileMenuOpen(false);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isProfileMenuOpen]);

  if (!authToken) {
    return (
      <main className="auth-shell">
        <section className="auth-stage">
          <section className="auth-intro-panel">
            <p className="auth-kicker">{t('app.title')}</p>
            <h1 className="auth-intro-title">{t('auth.introTitle')}</h1>
            <p className="auth-intro-copy">{t('auth.introCopy')}</p>
            <ul
              className="auth-intro-points"
              aria-label={t('auth.highlightsAria')}
            >
              <li>{t('auth.highlight1')}</li>
              <li>{t('auth.highlight2')}</li>
              <li>{t('auth.highlight3')}</li>
            </ul>
          </section>

          <section className="auth-card">
            <h2 className="auth-title">{t('auth.loginTitle')}</h2>
            <p className="auth-subtitle">
              Use the Corpus Login section in the sidebar to open the dashboard.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-toolbar">
        <div className="app-branding">
          <div className="app-brand-mark" aria-hidden="true">
            <img
              alt=""
              className="app-brand-mark-image"
              src={swechaBirdsIcon}
            />
          </div>
          <div>
            <h1 className="app-brand-title">{t('app.title')}</h1>
          </div>
        </div>

        <div className="app-toolbar-center" aria-label={t('app.swecha')}>
          <img
            alt={t('app.swecha')}
            className="swecha-logo-image"
            src={swechaLogoSrc}
          />
        </div>

        <div className="profile-menu-container">
          <LanguageSwitcher />
          <button
            aria-label={t('theme.switchMode', {
              mode: themeMode === 'dark' ? t('theme.light') : t('theme.dark'),
            })}
            className="theme-toggle-button"
            onClick={() =>
              setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
            type="button"
          >
            <span aria-hidden="true" className="theme-toggle-icon">
              {themeMode === 'dark' ? '☀' : '☾'}
            </span>
          </button>

          <button
            aria-label={t('profile.openMenu')}
            className="profile-icon-button"
            onClick={(event) => {
              event.stopPropagation();
              setIsProfileMenuOpen((prev) => !prev);
            }}
            type="button"
          >
            <span aria-hidden="true" className="profile-avatar-icon">
              {profileInitial}
            </span>
          </button>

          {isProfileMenuOpen ? (
            <div
              className="profile-menu-dropdown profile-menu-card"
              role="dialog"
            >
              <div className="profile-card-top">
                <span className="profile-card-avatar">{profileInitial}</span>
                <div>
                  <div className="profile-card-name">{profileDisplayName}</div>
                  <div className="profile-card-username">
                    {userProfile?.username
                      ? `@${userProfile.username}`
                      : username
                        ? `@${username.trim()}`
                        : t('common.unavailable')}
                  </div>
                </div>
              </div>
              <div className="profile-card-body">
                <div className="profile-card-row">
                  <span className="profile-card-label">
                    {t('profile.phoneLabel')}
                  </span>
                  <span className="profile-card-value">
                    {userProfile?.phone ?? username ?? t('common.unavailable')}
                  </span>
                </div>
              </div>
              <div className="profile-card-footer">
                <button
                  className="secondary-button profile-menu-logout"
                  onClick={handleLogout}
                  type="button"
                >
                  {t('auth.logout')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <DashboardHome
        addedInterns={addedInterns}
        authToken={authToken}
        onInternsChange={setAddedInterns}
        onRemoveIntern={handleRemoveIntern}
        preloadedTeams={preloadedTeams}
      />

      <footer className="app-footer">
        Swecha {currentYear} © All Rights Reserved.
      </footer>
    </div>
  );
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return 'dark';
}

function persistThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

async function fetchCsvText(
  path: string,
  expectedHeaders: string[]
): Promise<string> {
  const normalizedPath = path.replace(/^\/+/, '');
  const candidates = buildAssetFetchCandidates(normalizedPath);
  const errorMessages: string[] = [];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);

      if (!response.ok) {
        errorMessages.push(`${candidate} -> ${response.status}`);
        continue;
      }

      const text = await response.text();

      if (isValidCsvPayload(text, expectedHeaders)) {
        return text;
      }

      const firstLine = text.split(/\r?\n/, 1)[0] || '';
      const sanitizedFirstLine = firstLine.trim().slice(0, 80);
      errorMessages.push(
        `${candidate} -> invalid CSV payload (first line: "${sanitizedFirstLine}")`
      );
    } catch (error) {
      errorMessages.push(`${candidate} -> ${(error as Error).message}`);
    }
  }

  throw new Error(
    `CSV fetch failed for ${normalizedPath}: ${errorMessages.join(', ')}`
  );
}

function isValidCsvPayload(text: string, expectedHeaders: string[]): boolean {
  if (!text.trim()) {
    return false;
  }

  const firstLine = text
    .split(/\r?\n/, 1)[0]
    ?.replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();

  if (
    !firstLine ||
    firstLine.startsWith('<!doctype') ||
    firstLine.startsWith('<html')
  ) {
    return false;
  }

  const normalizedExpectedHeaders = expectedHeaders.map((header) =>
    header.trim().toLowerCase()
  );
  return normalizedExpectedHeaders.some((header) => firstLine.includes(header));
}

function mergeInternCollections(
  existing: Intern[],
  incoming: Intern[]
): Intern[] {
  const byId = new Map(existing.map((intern) => [intern.id, intern]));

  for (const intern of incoming) {
    if (!byId.has(intern.id)) {
      byId.set(intern.id, intern);
    }
  }

  return Array.from(byId.values());
}

function buildAssetFetchCandidates(path: string): string[] {
  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL || '/');
  const fileName = path.split('/').pop() || path;
  const candidates = [`${baseUrl}${path}`, `/${path}`, `./${path}`];

  if (typeof window !== 'undefined') {
    const currentDirectoryPath = window.location.pathname.replace(/[^/]*$/, '');
    if (currentDirectoryPath) {
      candidates.push(`${currentDirectoryPath}${path}`);
    }

    if (window.location.pathname.includes('/dist/')) {
      candidates.push(`/dist/${path}`);
      candidates.push(`./dist/${path}`);
    }

    const assetDirectory = resolveLoadedAssetDirectory();
    if (assetDirectory) {
      candidates.push(`${assetDirectory}${path}`);
      candidates.push(`${assetDirectory}${fileName}`);
    }

    candidates.push(new URL(path, window.location.href).toString());
  }

  return Array.from(new Set(candidates));
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim();

  if (!trimmedBaseUrl || trimmedBaseUrl === '/') {
    return '/';
  }

  const prefixed = trimmedBaseUrl.startsWith('/')
    ? trimmedBaseUrl
    : `/${trimmedBaseUrl}`;
  return prefixed.endsWith('/') ? prefixed : `${prefixed}/`;
}

function resolveLoadedAssetDirectory(): string {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return '';
  }

  const scriptOrLink = Array.from(
    document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
      'script[src*="/assets/"],link[href*="/assets/"]'
    )
  );

  for (const element of scriptOrLink) {
    const candidateUrl =
      element instanceof HTMLScriptElement
        ? element.src
        : element instanceof HTMLLinkElement
          ? element.href
          : '';

    if (!candidateUrl) {
      continue;
    }

    try {
      const parsed = new URL(candidateUrl, window.location.href);
      const directoryPath = parsed.pathname.replace(/[^/]*$/, '');

      if (!directoryPath.includes('/assets/')) {
        continue;
      }

      return `${parsed.origin}${directoryPath}`;
    } catch {
      // Ignore malformed URLs and continue to other candidates.
    }
  }

  return '';
}
