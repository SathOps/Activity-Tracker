import { useAuth } from '../../contexts/AuthContext';
import { getGitlabLoginUrl } from '../../services/api/auth';
import { LayoutGrid, Calendar, BarChart3, Trophy } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function GitComplianceWorkspace({ children }: Props) {
  const { gitlabConnected, isLoading } = useAuth();

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-8 shadow-sm dark:border-blue-900/30 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">
              Git Compliance Checker
            </p>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Verifying GitLab access…
          </h2>
        </div>
      </section>
    );
  }

  if (!gitlabConnected) {
    return (
      <div className="relative w-full overflow-hidden p-1">
        {/* Ambient Floating Blobs */}
        <div className="absolute rounded-full pointer-events-none z-0 opacity-[0.08] blur-[60px] dark:opacity-[0.15] dark:blur-[80px] w-[250px] h-[250px] -top-20 -right-[50px] bg-[radial-gradient(circle,#3b82f6_0%,#2563eb_100%)] animate-[float-blob-1_18s_infinite_ease-in-out_alternate]" />
        <div className="absolute rounded-full pointer-events-none z-0 opacity-[0.08] blur-[60px] dark:opacity-[0.15] dark:blur-[80px] w-[300px] h-[300px] -bottom-[100px] -left-20 bg-[radial-gradient(circle,#8b5cf6_0%,#6d28d9_100%)] animate-[float-blob-2_24s_infinite_ease-in-out_alternate]" />
        <div className="absolute rounded-full pointer-events-none z-0 opacity-[0.08] blur-[60px] dark:opacity-[0.15] dark:blur-[80px] w-[180px] h-[180px] top-[40%] left-[30%] bg-[radial-gradient(circle,#06b6d4_0%,#0891b2_100%)] animate-[float-blob-3_15s_infinite_ease-in-out_alternate]" />

        <section className="relative overflow-hidden rounded-[20px] bg-white border border-[var(--border-strong)] shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] hover:border-[var(--accent)] dark:bg-[#0d1525] dark:border-blue-500/15 dark:backdrop-blur-2xl dark:shadow-[0_8px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] dark:hover:border-blue-500/35 dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(59,130,246,0.08)] dark:animate-[border-glow-pulse_6s_infinite_ease-in-out] transition-all duration-300 p-8 md:p-12 animate-fadeInUp">
          <div className="relative z-10 max-w-4xl space-y-8">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider animate-fadeInUp animation-delay-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 dark:bg-indigo-400 animate-pulse" />
              Git Compliance Checker
            </div>

            {/* Title & Description */}
            <div className="space-y-4 animate-fadeInUp animation-delay-200">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Connect GitLab to open{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  compliance tools
                </span>
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-slate-650 dark:text-slate-300 max-w-3xl font-medium">
                Authorise your GitLab account via Secure OAuth to unlock
                comprehensive profile analytics, weekly contribution grids,
                mentor group compliance tracking, and team rankings.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp animation-delay-300">
              <div className="flex gap-4 rounded-xl p-4 transition-all duration-300 bg-[var(--surface-1)] border border-[var(--border)] hover:-translate-y-0.5 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] dark:bg-white/[0.03] dark:border-white/[0.05] dark:hover:bg-[rgba(59,130,246,0.06)] dark:hover:border-[rgba(59,130,246,0.2)]">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Developer Activity
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Real-time dashboard summarizing commit metrics, merge
                    request approvals, and issue status.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl p-4 transition-all duration-300 bg-[var(--surface-1)] border border-[var(--border)] hover:-translate-y-0.5 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] dark:bg-white/[0.03] dark:border-white/[0.05] dark:hover:bg-[rgba(59,130,246,0.06)] dark:hover:border-[rgba(59,130,246,0.2)]">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Weekly Performance
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Interactive activity grid mapping contribution trends and
                    standup submissions across a 7-day window.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl p-4 transition-all duration-300 bg-[var(--surface-1)] border border-[var(--border)] hover:-translate-y-0.5 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] dark:bg-white/[0.03] dark:border-white/[0.05] dark:hover:bg-[rgba(59,130,246,0.06)] dark:hover:border-[rgba(59,130,246,0.2)]">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Batch Analytics
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Advanced cohort level filters and progress auditing for
                    admins and mentors.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl p-4 transition-all duration-300 bg-[var(--surface-1)] border border-[var(--border)] hover:-translate-y-0.5 hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] dark:bg-white/[0.03] dark:border-white/[0.05] dark:hover:bg-[rgba(59,130,246,0.06)] dark:hover:border-[rgba(59,130,246,0.2)]">
                <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Team Leaderboard
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Leaderboard scored dynamically using weighted standup slots
                    and Git activity.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 animate-fadeInUp animation-delay-400">
              <button
                type="button"
                onClick={() => {
                  window.location.href = getGitlabLoginUrl();
                }}
                className="relative overflow-hidden inline-flex items-center gap-2.5 border-none font-display font-bold cursor-pointer px-[26px] py-3 rounded-xl text-sm tracking-[0.02em] bg-gradient-to-r from-[#e24329] via-[#fc6d26] to-[#fca326] bg-[length:200%_auto] text-white transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_4px_15px_rgba(240,74,32,0.35)] hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_25px_rgba(240,74,32,0.5),0_0_15px_rgba(252,109,38,0.3)] hover:bg-right active:translate-y-0 active:scale-[0.98] after:absolute after:top-0 after:w-1/2 after:h-full after:pointer-events-none after:left-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent after:skew-x-[-25deg] after:animate-[shimmer-sweep_3s_infinite_ease-in-out]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
                </svg>
                Connect with GitLab
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
