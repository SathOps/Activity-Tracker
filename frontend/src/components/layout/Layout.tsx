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
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.05),transparent_35%),linear-gradient(135deg,#010409,#020713,#040f20)]">
        <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
          {/* Glass header */}
          <div style={{ position: 'relative', marginBottom: 28 }}>
            {/* Glow effect blob behind card */}
            <div
              style={{
                position: 'absolute',
                top: -15,
                left: -15,
                right: -15,
                bottom: 0,
                background:
                  themeMode === 'dark'
                    ? 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.18) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 100%)'
                    : 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)',
                filter: 'blur(30px)',
                borderRadius: 30,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <header
              className="border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[20px]"
              style={{
                borderRadius: 20,
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
                background:
                  themeMode === 'dark'
                    ? 'rgba(15, 23, 42, 0.75)'
                    : 'rgba(255, 255, 255, 0.7)',
                boxShadow:
                  themeMode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(99, 130, 255, 0.08), 0 0 60px rgba(59, 130, 246, 0.15)'
                    : '0 8px 32px rgba(31, 38, 135, 0.06), 0 0 0 1px rgba(59, 130, 246, 0.08), 0 0 60px rgba(59, 130, 246, 0.08)',
              }}
            >
              {/* Gradient accent bar */}
              <div
                style={{
                  height: 3,
                  background:
                    'linear-gradient(90deg, #6366f1 0%, #3b82f6 30%, #06b6d4 60%, #8b5cf6 100%)',
                  borderRadius: '20px 20px 0 0',
                }}
              />

              {/* Inner highlight edge */}
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    themeMode === 'dark'
                      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{ padding: '20px 28px' }}
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                      background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {modeMeta.section}
                  </p>
                  <h1
                    style={{
                      margin: '8px 0 0',
                      fontSize: 26,
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      color: themeMode === 'dark' ? '#F8FAFC' : '#0F172A',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    {modeMeta.title}
                  </h1>
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 14,
                      color: themeMode === 'dark' ? '#94A3B8' : '#64748B',
                      maxWidth: '60ch',
                      lineHeight: 1.6,
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
                        themeMode === 'dark'
                          ? t('theme.light')
                          : t('theme.dark'),
                    })}
                    onClick={() =>
                      setThemeMode((prev) =>
                        prev === 'dark' ? 'light' : 'dark'
                      )
                    }
                    type="button"
                    style={{
                      width: 58,
                      height: 32,
                      borderRadius: 99,
                      background:
                        themeMode === 'dark'
                          ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(79, 70, 229, 0.25))'
                          : 'rgba(0, 0, 0, 0.05)',
                      border: 'none',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow:
                        themeMode === 'dark'
                          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(59, 130, 246, 0.15)'
                          : 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                      outline: 'none',
                    }}
                  >
                    {/* Background Icons */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingLeft: 8,
                        paddingRight: 8,
                        pointerEvents: 'none',
                      }}
                    >
                      <Sun
                        size={11}
                        style={{
                          color: 'var(--amber-500)',
                          opacity: themeMode === 'dark' ? 0.35 : 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                      <Moon
                        size={11}
                        style={{
                          color: 'var(--indigo-400)',
                          opacity: themeMode === 'dark' ? 0 : 0.35,
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                    </div>

                    {/* Sliding Handle */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background:
                          themeMode === 'dark'
                            ? 'linear-gradient(135deg, #ffffff, #cbd5e1)'
                            : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        transform:
                          themeMode === 'dark'
                            ? 'translateX(26px)'
                            : 'translateX(0px)',
                        transition:
                          'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
                        zIndex: 2,
                      }}
                    >
                      {themeMode === 'dark' ? (
                        <Moon
                          size={11}
                          className="text-indigo-600 fill-indigo-600"
                        />
                      ) : (
                        <Sun
                          size={11}
                          className="text-amber-500 fill-amber-500"
                        />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </header>
          </div>

          {isComplianceMode && !gitlabConnected && (
            <div
              className="relative overflow-hidden flex items-center gap-3 px-5 py-4 rounded-[14px] bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.04))] backdrop-blur-[20px] border border-[rgba(245,158,11,0.25)] text-[#ffedd5] text-[13.5px] leading-[1.5]"
              style={{
                marginBottom: 24,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  color: '#f59e0b',
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                }}
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                GitLab account not connected. Use the{' '}
                <strong style={{ color: '#fbbf24' }}>
                  Connect with GitLab
                </strong>{' '}
                button to enable compliance features.
              </span>
            </div>
          )}
          <div className="min-w-0">{children}</div>
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
