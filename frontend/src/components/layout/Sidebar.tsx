import {
  Eye,
  EyeOff,
  RefreshCw,
  User,
  BarChart3,
  Trophy,
  Calendar,
  Database,
  Mic,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { useHealth } from '../../hooks/useHealth';
import { corpusLogout, storeGitlabToken } from '../../api';
import { cn } from '../../lib/utils';
import type { AppMode, UserRole } from '../../types';

// ── Mode definitions ──────────────────────────────────────────────────────────

const ALL_MODES: {
  id: AppMode;
  label: string;
  icon: React.ReactNode;
  desc: string;
  roles: UserRole[];
}[] = [
  {
    id: 'standup',
    label: 'Standup Tracker',
    icon: <Mic size={16} />,
    desc: 'Current production app',
    roles: ['admin', 'intern', 'mentor'],
  },
  {
    id: 'profile',
    label: 'User Profile',
    icon: <User size={16} />,
    desc: 'Developer activity',
    roles: ['admin', 'intern', 'mentor'],
  },
  {
    id: 'weekly',
    label: 'Weekly Performance',
    icon: <Calendar size={16} />,
    desc: 'Daily activity grid',
    roles: ['admin', 'intern', 'mentor'],
  },
  {
    id: 'batch',
    label: 'Batch Analytics',
    icon: <BarChart3 size={16} />,
    desc: 'Bulk user report',
    roles: ['admin', 'mentor'],
  },
  {
    id: 'leaderboard',
    label: 'Team Leaderboard',
    icon: <Trophy size={16} />,
    desc: 'Score & rank teams',
    roles: ['admin', 'mentor'],
  },
  {
    id: 'roster',
    label: 'Roster Management',
    icon: <Database size={16} />,
    desc: 'Manage batches/teams',
    roles: ['admin'],
  },
];

const COMPLIANCE_MODES = ALL_MODES.filter((mode) => mode.id !== 'standup');

// Role badge colours
const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  mentor: 'bg-blue-100   text-blue-700',
  intern: 'bg-green-100  text-green-700',
};

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const {
    gitlabUrl,
    gitlabToken,
    activeMode,
    userRole,
    corpusUser,
    setGitlabUrl,
    setGitlabToken,
    setActiveMode,
    clearCorpusToken,
  } = useConfigStore();

  const { data: health, isLoading, refetch } = useHealth();
  const [showToken, setShowToken] = useState(false);
  const [gitlabTokenInput, setGitlabTokenInput] = useState('');
  const [gitlabError, setGitlabError] = useState<string | null>(null);
  const [gitlabSubmitting, setGitlabSubmitting] = useState(false);

  const authenticated = !!health;
  const isComplianceMode = activeMode !== 'standup';
  const visibleComplianceModes = COMPLIANCE_MODES.filter((mode) =>
    mode.roles.includes(userRole)
  );

  async function handleCorpusLogout() {
    await corpusLogout().catch(() => undefined);
    clearCorpusToken();
    setGitlabToken('');
  }

  async function handleGitlabSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gitlabTokenInput.trim()) return;
    setGitlabSubmitting(true);
    setGitlabError(null);
    try {
      const result = await storeGitlabToken(gitlabTokenInput.trim(), gitlabUrl);
      setGitlabToken('session');
      setUserRoleFromHealth(result.role);
      setGitlabTokenInput('');
      await refetch();
    } catch (caught) {
      setGitlabToken('');
      setGitlabError(
        caught instanceof Error ? caught.message : 'GitLab validation failed'
      );
    } finally {
      setGitlabSubmitting(false);
    }
  }

  function setUserRoleFromHealth(role: UserRole) {
    useConfigStore.getState().setUserRole(role);
    useConfigStore.getState().setIsAuthenticated(true);
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <span className="text-xl">📊</span>
        <div>
          <h1 className="text-sm font-bold text-slate-800 leading-none">
            Internship Tracker
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Activity Dashboard
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Session
          </p>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-indigo-700">Corpus Connected</p>
                <p className="mt-1 truncate text-indigo-500">
                  {corpusUser || 'active session'}
                </p>
              </div>
              <button
                onClick={() => void handleCorpusLogout()}
                className="text-indigo-500 hover:text-indigo-700"
                title="Logout from Corpus"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Features
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveMode('standup')}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors',
                !isComplianceMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="flex-shrink-0">
                <Mic size={16} />
              </span>
              <div>
                <p className="font-medium text-xs leading-none">
                  Standup Tracker
                </p>
                <p
                  className={cn(
                    'text-[10px] mt-0.5',
                    !isComplianceMode ? 'text-blue-200' : 'text-slate-400'
                  )}
                >
                  Corpus-based operations
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                setActiveMode(activeMode === 'standup' ? 'profile' : activeMode)
              }
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors',
                isComplianceMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="flex-shrink-0">
                <BarChart3 size={16} />
              </span>
              <div>
                <p className="font-medium text-xs leading-none">
                  Git Compliance Checker
                </p>
                <p
                  className={cn(
                    'text-[10px] mt-0.5',
                    isComplianceMode ? 'text-blue-200' : 'text-slate-400'
                  )}
                >
                  GitLab-based analytics
                </p>
              </div>
            </button>
          </nav>
        </section>

        {isComplianceMode ? (
          <>
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                GitLab
              </p>

              {/* GitLab URL */}
              <form className="space-y-3" onSubmit={handleGitlabSubmit}>
                <div>
                  <label
                    className="block mb-1 text-xs font-medium text-slate-600"
                    htmlFor="gitlab-url"
                  >
                    GitLab URL
                  </label>
                  <input
                    id="gitlab-url"
                    type="url"
                    value={gitlabUrl}
                    onChange={(e) => setGitlabUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="https://code.swecha.org"
                  />
                </div>

                {/* GitLab Token */}
                <div className="mb-3">
                  <label
                    className="block mb-1 text-xs font-medium text-slate-600"
                    htmlFor="gitlab-token"
                  >
                    GitLab Token
                  </label>
                  <div className="relative">
                    <input
                      id="gitlab-token"
                      type={showToken ? 'text' : 'password'}
                      value={gitlabTokenInput}
                      onChange={(e) => setGitlabTokenInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 pr-8 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="glpat-xxxxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {gitlabError && (
                  <p className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-600">
                    {gitlabError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!gitlabTokenInput.trim() || gitlabSubmitting}
                  className="w-full rounded bg-blue-600 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {gitlabSubmitting ? 'Connecting…' : 'Connect GitLab'}
                </button>
              </form>

              {/* Auth status + role badge */}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-xs flex items-center justify-between',
                  authenticated
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      authenticated
                        ? 'bg-green-500'
                        : isLoading
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-300'
                    )}
                  />
                  {authenticated
                    ? `@${health.user.username}`
                    : isLoading
                      ? 'Verifying…'
                      : gitlabToken
                        ? 'Not verified'
                        : 'Not connected'}
                </span>
                <span className="flex items-center gap-1.5">
                  {authenticated && (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                        ROLE_STYLES[userRole]
                      )}
                    >
                      {userRole}
                    </span>
                  )}
                  {gitlabToken && (
                    <button
                      onClick={() => refetch()}
                      className="text-slate-400 hover:text-slate-600"
                      title="Re-check"
                    >
                      <RefreshCw
                        size={12}
                        className={isLoading ? 'animate-spin' : ''}
                      />
                    </button>
                  )}
                </span>
              </div>
            </section>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Compliance Views
              </p>
              <nav className="space-y-1">
                {visibleComplianceModes.map((mode) => {
                  const isActive = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      disabled={!authenticated}
                      className={cn(
                        'w-full rounded-lg px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors',
                        isActive && authenticated
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                      )}
                    >
                      <span className="flex-shrink-0">{mode.icon}</span>
                      <div>
                        <p className="font-medium text-xs leading-none">
                          {mode.label}
                        </p>
                        <p
                          className={cn(
                            'text-[10px] mt-0.5',
                            isActive && authenticated
                              ? 'text-blue-200'
                              : 'text-slate-400'
                          )}
                        >
                          {mode.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </section>
          </>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-5 py-3">
        <p className="text-[10px] text-slate-400 text-center">
          Internship Activity Tracker v2.0
        </p>
      </div>
    </aside>
  );
}
