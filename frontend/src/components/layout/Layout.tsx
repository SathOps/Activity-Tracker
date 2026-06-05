import {
  Sun,
  Moon,
  LayoutGrid,
  Users2,
  Mic,
  Users,
  BarChart2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Menu,
} from 'lucide-react';
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
  const { pathname, navigate } = useRouter();
  const { corpusToken, activeStandupPanel, setActiveStandupPanel } =
    useConfigStore();
  const { user, gitlabConnected } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    readStoredThemeMode()
  );
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isIslandCollapsed, setIsIslandCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ThemeToggle = () => (
    <button
      aria-label={t('theme.switchMode', {
        mode: themeMode === 'dark' ? t('theme.light') : t('theme.dark'),
      })}
      onClick={() =>
        setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
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
            themeMode === 'dark' ? 'translateX(26px)' : 'translateX(0px)',
          transition:
            'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
          zIndex: 2,
        }}
      >
        {themeMode === 'dark' ? (
          <Moon size={11} className="text-indigo-600 fill-indigo-600" />
        ) : (
          <Sun size={11} className="text-amber-500 fill-amber-500" />
        )}
      </div>
    </button>
  );

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
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.08),transparent_45%),linear-gradient(135deg,#0b1220_0%,#0d1f3d_40%,#112d5c_100%)]">
        <div
          className={`px-4 py-6 md:px-8 md:py-6 max-w-[1200px] mx-auto min-w-0 ${isStandupMode ? 'pb-24 md:pb-6' : ''}`}
        >
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
            <header className="relative z-10 overflow-hidden border border-white/20 dark:border-white/5 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl rounded-[20px] shadow-lg shadow-slate-200/50 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
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
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                {/* Mobile top controls bar */}
                <div className="flex items-center justify-between md:hidden w-full pb-3 border-b border-[rgba(148,163,184,0.08)]">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-xl transition-all border border-slate-800/40 flex items-center justify-center shrink-0"
                    aria-label="Open Sidebar"
                  >
                    <Menu size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>

                {/* Title block */}
                <div className="min-w-0">
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

                {/* Desktop controls */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                  <LanguageSwitcher />
                  <ThemeToggle />
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
          <>
            {/* Desktop Floating Island Navigation */}
            {/* Desktop Floating Island Navigation Container */}
            <div
              className={`fixed bottom-6 left-[calc(50%+150px)] -translate-x-1/2 z-50 hidden md:block transition-all duration-500 ${
                isIslandCollapsed ? 'w-10 h-10' : 'w-[520px] h-16'
              }`}
            >
              {/* The Masked Nav Bar */}
              <nav
                className={`w-full h-full flex items-center transition-all duration-500 ${
                  isIslandCollapsed
                    ? 'bg-transparent border-transparent backdrop-blur-none shadow-none justify-center'
                    : 'bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] px-8 justify-between rounded-full [mask-image:radial-gradient(circle_at_50%_0,transparent_34px,black_35px)] [-webkit-mask-image:radial-gradient(circle_at_50%_0,transparent_34px,black_35px)]'
                }`}
                onClick={
                  isIslandCollapsed
                    ? () => setIsIslandCollapsed(false)
                    : undefined
                }
                onKeyDown={
                  isIslandCollapsed
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setIsIslandCollapsed(false);
                        }
                      }
                    : undefined
                }
                tabIndex={isIslandCollapsed ? 0 : -1}
                role={isIslandCollapsed ? 'button' : undefined}
                title={isIslandCollapsed ? 'Expand Panel' : undefined}
              >
                {isIslandCollapsed ? (
                  <div className="flex items-center justify-center text-white animate-bounce cursor-pointer">
                    <ChevronUp
                      size={24}
                      className="drop-shadow-[0_0_8px_#3b82f6] hover:drop-shadow-[0_0_15px_#6366f1] transition-all duration-300"
                    />
                  </div>
                ) : (
                  <>
                    {/* Status */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStandupPanel('status');
                        if (pathname !== '/standup') navigate('/standup');
                      }}
                      className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all duration-200 hover:scale-105 bg-transparent border-none cursor-pointer ${
                        activeStandupPanel === 'status' &&
                        pathname === '/standup'
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid size={18} />
                      <span className="text-[10px] tracking-wide">Status</span>
                    </button>

                    {/* Teams */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStandupPanel('teams');
                        if (pathname !== '/standup') navigate('/standup');
                      }}
                      className={`flex flex-col items-center justify-center gap-1 w-20 h-12 transition-all duration-200 hover:scale-105 bg-transparent border-none cursor-pointer ${
                        activeStandupPanel === 'teams' &&
                        pathname === '/standup'
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Users2 size={18} />
                      <span className="text-[10px] tracking-wide text-center leading-none">
                        {user?.role === 'intern'
                          ? 'Manage Team'
                          : 'Team Manage'}
                      </span>
                    </button>

                    {/* Mic Spacer */}
                    <div className="w-14 h-12" />

                    {/* Logs */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStandupPanel('interns');
                        if (pathname !== '/standup') navigate('/standup');
                      }}
                      className={`flex flex-col items-center justify-center gap-1 w-20 h-12 transition-all duration-200 hover:scale-105 bg-transparent border-none cursor-pointer ${
                        activeStandupPanel === 'interns' &&
                        pathname === '/standup'
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {user?.role === 'intern' ? (
                        <ClipboardList size={18} />
                      ) : (
                        <Users size={18} />
                      )}
                      <span className="text-[10px] tracking-wide text-center leading-none">
                        {user?.role === 'intern'
                          ? 'Standups Logs'
                          : 'Intern Directory'}
                      </span>
                    </button>

                    {/* Analytics */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStandupPanel('analytics');
                        if (pathname !== '/standup') navigate('/standup');
                      }}
                      className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all duration-200 hover:scale-105 bg-transparent border-none cursor-pointer ${
                        activeStandupPanel === 'analytics' &&
                        pathname === '/standup'
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <BarChart2 size={18} />
                      <span className="text-[10px] tracking-wide">
                        {user?.role === 'intern'
                          ? 'Team Analytics'
                          : 'Analytics'}
                      </span>
                    </button>
                  </>
                )}
              </nav>

              {/* Absolutely Positioned Mic Button (sits outside the masked nav) */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 z-50 pointer-events-auto transition-all duration-500 ${
                  isIslandCollapsed
                    ? 'scale-0 opacity-0 pointer-events-none'
                    : 'scale-100 opacity-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(true)}
                  className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 cursor-pointer border-none"
                  title="Record Standup"
                >
                  <Mic size={20} />
                </button>
              </div>

              {/* Absolutely Positioned Close Arrow Wrapper (handles centering) */}
              {!isIslandCollapsed && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-16 z-50 w-12 h-8 flex items-center justify-center pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIslandCollapsed(true);
                    }}
                    className="text-white cursor-pointer border-none bg-transparent hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce flex items-center justify-center w-full h-full"
                    title="Collapse Panel"
                  >
                    <ChevronDown
                      size={24}
                      strokeWidth={2}
                      className="drop-shadow-[0_0_8px_#3b82f6] hover:drop-shadow-[0_0_15px_#6366f1] transition-all duration-300"
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden">
              <MobileBottomNav
                onRecordClick={() => setIsRecordModalOpen(true)}
              />
            </div>
          </>
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
