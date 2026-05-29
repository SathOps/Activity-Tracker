import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { RecordStandupModal } from '../RecordStandupModal';
import { useConfigStore } from '../../stores/configStore';
import { useAuth } from '../../contexts/AuthContext';
import { getRouteMeta } from '../../lib/appRoutes';
import { useRouter } from '../../lib/router';

interface Props {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = 'standup_theme_mode';

type ThemeMode = 'light' | 'dark';

export function Layout({ children }: Props) {
  const { t } = useTranslation();
  const { pathname } = useRouter();
  const {
    gitlabToken,
    activeMode,
    corpusUser,
    corpusToken,
    activeStandupPanel,
    clearCorpusToken,
  } = useConfigStore();
  const { gitlabConnected } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    readStoredThemeMode()
  );
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const modeMeta = getRouteMeta(pathname);
  const corpusUserLabel = corpusUser.trim();
  const isStandupMode = modeMeta.workspace === 'standup';
  const isComplianceMode = modeMeta.workspace === 'compliance';

  useEffect(() => {
    persistThemeMode(themeMode);

    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          background:
            'linear-gradient(135deg, #f0f2f8 0%, #e8ecf5 50%, #f0f0fa 100%)',
        }}
      >
        <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
          {/* Glass header */}
          <header
            style={{
              marginBottom: 28,
              borderRadius: 20,
              padding: '20px 28px',
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow:
                '0 4px 24px rgba(15, 20, 40, 0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    color: 'var(--indigo-400)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {modeMeta.section}
                </p>
                <h1
                  style={{
                    margin: '6px 0 0',
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--slate-900)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {modeMeta.title}
                </h1>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 14,
                    color: 'var(--slate-500)',
                    maxWidth: '60ch',
                  }}
                >
                  {modeMeta.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  aria-label={t('theme.switchMode', {
                    mode:
                      themeMode === 'dark' ? t('theme.light') : t('theme.dark'),
                  })}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onClick={() =>
                    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
                  }
                  type="button"
                >
                  <span aria-hidden="true">
                    {themeMode === 'dark' ? '☀' : '☾'}
                  </span>
                </button>
                {corpusUserLabel ? (
                  <div className="tracker-sidebar__session-card ml-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 leading-none mb-1">
                          Corpus Session
                        </p>
                        <p className="truncate font-semibold text-indigo-700 leading-none">
                          {corpusUserLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearCorpusToken}
                        className="rounded-lg bg-indigo-50 p-1.5 text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
                        title="Logout"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {isComplianceMode && !gitlabConnected && (
            <div
              style={{
                marginBottom: 24,
                padding: '14px 20px',
                borderRadius: 12,
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                fontSize: 13,
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠</span>
              <span>
                GitLab account not connected. Use the{' '}
                <strong>Connect with GitLab</strong> button in the sidebar to
                enable compliance features.
              </span>
            </div>
          )}
          <div className="tracker-main__content">{children}</div>
        </div>
      </main>

      {isStandupMode && (
        <MobileBottomNav onRecordClick={() => setIsRecordModalOpen(true)} />
      )}

      {isRecordModalOpen && (
        <RecordStandupModal
          authToken={corpusToken}
          onClose={() => setIsRecordModalOpen(false)}
          onSuccess={() => setIsRecordModalOpen(false)}
        />
      )}
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
