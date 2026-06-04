import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { Sidebar } from './Sidebar';
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
  const { corpusToken } = useConfigStore();
  const { gitlabConnected } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    readStoredThemeMode()
  );
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const modeMeta = getRouteMeta(pathname);
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
          background: `
      radial-gradient(circle at top right,
      rgba(59,130,246,.12),
      transparent 35%),

      radial-gradient(circle at bottom left,
      rgba(96,165,250,.08),
      transparent 35%),

      linear-gradient(
      135deg,
      #020817,
      #071428,
      #0f1d3b
      )
      `,
        }}
      >
        <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
          {/* Glass header */}
          <header
            style={{
              marginBottom: 28,
              borderRadius: 20,
              padding: '20px 28px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,.08)',
              boxShadow: '0 0 30px rgba(59,130,246,.12)',
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
                  className="theme-toggle-btn"
                  onClick={() =>
                    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
                  }
                  type="button"
                >
                  {themeMode === 'dark' ? (
                    <Sun size={18} className="text-amber-400" />
                  ) : (
                    <Moon size={18} className="text-slate-700" />
                  )}
                </button>
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

        {isStandupMode && (
          <MobileBottomNav onRecordClick={() => setIsRecordModalOpen(true)} />
        )}
      </main>

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
