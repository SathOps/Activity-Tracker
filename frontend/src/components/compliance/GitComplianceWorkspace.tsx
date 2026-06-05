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
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />

        <section className="git-connect-card p-8 md:p-12 animate-fadeInUp">
          <div className="relative z-10 max-w-4xl space-y-8">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider animate-fadeInUp animation-delay-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Git Compliance Checker
            </div>

            {/* Title & Description */}
            <div className="space-y-4 animate-fadeInUp animation-delay-200">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
                Connect GitLab to open{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  compliance tools
                </span>
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-slate-300 max-w-3xl">
                Authorise your GitLab account via Secure OAuth to unlock
                comprehensive profile analytics, weekly contribution grids,
                mentor group compliance tracking, and team rankings.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeInUp animation-delay-300">
              <div className="feature-item-card flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 font-display">
                    Developer Activity
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Real-time dashboard summarizing commit metrics, merge
                    request approvals, and issue status.
                  </p>
                </div>
              </div>

              <div className="feature-item-card flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 font-display">
                    Weekly Performance
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Interactive activity grid mapping contribution trends and
                    standup submissions across a 7-day window.
                  </p>
                </div>
              </div>

              <div className="feature-item-card flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 font-display">
                    Batch Analytics
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Advanced cohort level filters and progress auditing for
                    admins and mentors.
                  </p>
                </div>
              </div>

              <div className="feature-item-card flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 font-display">
                    Team Leaderboard
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
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
                className="gitlab-shimmer-btn"
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
