import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardHome from './components/dashboard/DashboardHome';
import LanguageSwitcher from './components/LanguageSwitcher';
import swechaBirdsIcon from '../images/swecha-birds-icon.png';
import swechaDarkLogo from '../images/Swecha-lite.png';
import swechaLightLogo from '../images/swecha-dark.png';
import type { Team } from './components/dashboard/TeamList';
import type { Intern } from './components/intern/InternSearch';
import {
  configureCorpusService,
  getCurrentUser,
  type InternSummary,
} from './services/corpus';
import {
  buildCorpusApiUrl,
  getCorpusApiBaseUrl,
} from './services/corpus/apiUrl';
import { parseInternsCSV } from './utils/parseInternsCSV';
import {
  buildPreloadedTeams,
  parseTeamMembersCSV,
  parseTeamsCSV,
} from './utils/parseTeamSeedCSV';

const ACCESS_TOKEN_STORAGE_KEY = 'corpus_access_token';
const USERNAME_STORAGE_KEY = 'corpus_username';
const THEME_STORAGE_KEY = 'standup_theme_mode';

type ThemeMode = 'light' | 'dark';

const CORPUS_DEFAULT_BASE =
  getCorpusApiBaseUrl() || 'https://api.corpus.swecha.org';

export default function App() {
  const { t } = useTranslation();
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);
  const [preloadedTeams, setPreloadedTeams] = useState<Team[]>([]);
  const [authToken, setAuthToken] = useState(() => readStoredAccessToken());
  const [username, setUsername] = useState(() => readStoredUsername());
  const [userProfile, setUserProfile] = useState<InternSummary | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
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
    persistAccessToken(authToken);
  }, [authToken]);
  useEffect(() => {
    persistUsername(username);
  }, [username]);
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

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = normalizePhoneInput(phone);
    const nextPassword = password.trim();

    if (!normalizedPhone || !nextPassword) {
      setLoginError(t('validation.phoneAndPasswordRequired'));
      return;
    }

    if (normalizedPhone.length !== 10) {
      setLoginError(t('validation.phoneMustBeTenDigits'));
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const phoneCandidates = buildLoginPhoneCandidates(normalizedPhone);
      let payload: unknown = null;
      let lastErrorMessage = '';
      let lastStatus = 0;

      for (const loginPhone of phoneCandidates) {
        const response = await fetch(buildCorpusApiUrl('/api/v1/auth/login'), {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: loginPhone,
            password: nextPassword,
          }),
        });

        if (response.ok) {
          payload = (await response.json()) as unknown;
          break;
        }

        lastStatus = response.status;
        lastErrorMessage = await extractErrorMessage(response);
      }

      if (!payload) {
        setLoginError(
          lastErrorMessage ||
            t('auth.loginFailedWithStatus', {
              status: lastStatus || t('common.unknown'),
            })
        );
        return;
      }

      const accessToken = readAccessToken(payload);

      if (!accessToken) {
        setLoginError(t('auth.tokenMissing'));
        return;
      }

      setAuthToken(accessToken);
      setUsername(normalizedPhone);
      setPassword('');
      setLoginError(null);
    } catch (error) {
      console.error('Login request failed', error);
      setLoginError(t('auth.endpointUnavailable'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setUsername('');
    setAddedInterns([]);
    setPreloadedTeams([]);
    setPassword('');
    setLoginError(null);
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
            <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>
            <form className="auth-form" onSubmit={handleLogin}>
              <label className="auth-label">
                {t('auth.phone')}
                <input
                  autoComplete="tel"
                  className="auth-input"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) =>
                    setPhone(normalizePhoneInput(event.target.value))
                  }
                  pattern="[0-9]{10}"
                  placeholder={t('auth.phonePlaceholder')}
                  type="text"
                  value={phone}
                />
              </label>
              <label className="auth-label">
                {t('auth.password')}
                <input
                  autoComplete="current-password"
                  className="auth-input"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  type="password"
                  value={password}
                />
              </label>
              {loginError ? <p className="auth-error">{loginError}</p> : null}
              <button
                className="primary-button auth-submit"
                disabled={isLoggingIn}
                type="submit"
              >
                {isLoggingIn ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </form>
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

function readStoredAccessToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? '';
}

function persistAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

function readStoredUsername(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(USERNAME_STORAGE_KEY) ?? '';
}

function persistUsername(username: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!username) {
    window.localStorage.removeItem(USERNAME_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
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

function readAccessToken(payload: unknown): string {
  if (!isRecord(payload)) {
    return '';
  }

  const directToken = asString(payload.access_token);

  if (directToken) {
    return directToken;
  }

  if (!isRecord(payload.data)) {
    return '';
  }

  return asString(payload.data.access_token);
}

function buildLoginPhoneCandidates(phoneDigits: string): string[] {
  return [`+91${phoneDigits}`, phoneDigits];
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

function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;

    if (typeof payload === 'string') {
      return payload.trim();
    }

    if (!isRecord(payload)) {
      return '';
    }

    const detail = payload.detail;

    if (typeof detail === 'string') {
      return detail.trim();
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry;
          }

          if (isRecord(entry)) {
            return asString(entry.msg) || asString(entry.message) || '';
          }

          return '';
        })
        .filter((message) => message.length > 0)
        .join(', ');
    }

    return asString(payload.message);
  } catch {
    return '';
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
