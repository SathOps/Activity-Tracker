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
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { useHealth } from '../../hooks/useHealth';
import { corpusLogin } from '../../api';
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

// Role badge colours
const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  mentor: 'bg-blue-100   text-blue-700',
  intern: 'bg-green-100  text-green-700',
};

// ── Corpus Login sub-component ────────────────────────────────────────────────

function CorpusLoginSection() {
  const { corpusToken, corpusUser, setCorpusToken, clearCorpusToken } =
    useConfigStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!corpusToken);

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await corpusLogin(phone.trim(), password.trim());
      setCorpusToken(res.access_token, res.username || phone);
      setPassword('');
      setExpanded(false);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Logged-in state ───────────────────────────────────────────────────────
  if (corpusToken) {
    return (
      <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
            <Mic size={11} />
            Corpus: {corpusUser || 'connected'}
          </span>
          <button
            onClick={clearCorpusToken}
            className="text-indigo-400 hover:text-indigo-600"
            title="Logout from Corpus"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <span className="flex items-center gap-1.5">
          <Mic size={12} className="text-slate-400" />
          Corpus Login
        </span>
        <span className="text-slate-400 text-[10px]">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <form
          onSubmit={handleLogin}
          className="px-3 pb-3 space-y-2 bg-slate-50 border-t border-slate-100"
        >
          <div className="pt-2">
            <label
              className="block mb-1 text-[10px] font-medium text-slate-500"
              htmlFor="corpus-phone"
            >
              Phone
            </label>
            <input
              id="corpus-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              placeholder="+91xxxxxxxxxx"
              required
            />
          </div>
          <div>
            <label
              className="block mb-1 text-[10px] font-medium text-slate-500"
              htmlFor="corpus-password"
            >
              Password
            </label>
            <input
              id="corpus-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-600 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 size={11} className="animate-spin" /> Logging in…
              </>
            ) : (
              'Login to Corpus'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const {
    gitlabUrl,
    gitlabToken,
    activeMode,
    userRole,
    setGitlabUrl,
    setGitlabToken,
    setActiveMode,
  } = useConfigStore();

  const { data: health, isLoading, refetch } = useHealth();
  const [showToken, setShowToken] = useState(false);

  const authenticated = !!health;

  // Filter modes based on role — matches Streamlit RBAC logic
  const visibleModes = ALL_MODES.filter((m) => m.roles.includes(userRole));

  // If the currently active mode is no longer visible, reset to first available.
  const activeModeIsVisible = visibleModes.some((m) => m.id === activeMode);

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
        {/* GitLab Config section */}
        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            GitLab
          </p>

          {/* GitLab URL */}
          <div className="mb-3">
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
                value={gitlabToken}
                onChange={(e) => setGitlabToken(e.target.value)}
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
                    ? 'Invalid token'
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

        {/* Corpus Login section */}
        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Corpus
          </p>
          <CorpusLoginSection />
        </section>

        {/* Mode selector */}
        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Mode
          </p>
          <nav className="space-y-1">
            {visibleModes.map((m) => {
              const isActive =
                (activeModeIsVisible ? activeMode : visibleModes[0]?.id) ===
                m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  disabled={!authenticated}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left flex items-center gap-3 text-sm transition-colors',
                    isActive && authenticated
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  <span className="flex-shrink-0">{m.icon}</span>
                  <div>
                    <p className="font-medium text-xs leading-none">
                      {m.label}
                    </p>
                    <p
                      className={cn(
                        'text-[10px] mt-0.5',
                        isActive && authenticated
                          ? 'text-blue-200'
                          : 'text-slate-400'
                      )}
                    >
                      {m.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </section>
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
