import { useAuth } from '../../contexts/AuthContext';
import { getGitlabLoginUrl } from '../../services/api/auth';

interface Props {
  children: React.ReactNode;
}

export function GitComplianceWorkspace({ children }: Props) {
  const { gitlabConnected, isLoading } = useAuth();

  if (isLoading) {
    return (
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">
            Git Compliance Checker
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            Verifying GitLab access…
          </h2>
        </div>
      </section>
    );
  }

  if (!gitlabConnected) {
    return (
      <section
        className="opacity-0 animate-[fadeInUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] hover:!border-[rgba(59,130,246,0.3)]"
        style={{
          padding: '32px',
          borderRadius: 14,
          background:
            'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.03))',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          boxShadow:
            '0 0 25px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-3xl space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
            Git Compliance Checker
          </p>
          <h2 className="text-3xl font-bold text-slate-100">
            Connect GitLab to open compliance tools
          </h2>
          <p className="text-base leading-7 text-slate-300">
            Authorise your GitLab account via OAuth to unlock profile, weekly
            performance, mentor groups, batch analytics, and leaderboard views.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = getGitlabLoginUrl();
            }}
            className="relative overflow-hidden inline-flex items-center gap-2 border-none bg-[linear-gradient(135deg,#2563eb,#60a5fa,#2563eb)] bg-[length:200%_auto] text-white font-semibold cursor-pointer transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:scale-[1.04] hover:-translate-y-[2px] hover:bg-[position:right_center] hover:shadow-[0_0_25px_rgba(59,130,246,0.5),0_4px_12px_rgba(37,99,235,0.4)] active:scale-[0.97] active:translate-y-0 after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-[5px] after:h-[5px] after:bg-[rgba(255,255,255,0.4)] after:opacity-0 after:rounded-full after:-translate-x-1/2 after:-translate-y-1/2 after:origin-center focus:not(:active):after:animate-[ripple_0.6s_ease-out] animate-[btn-idle-pulse_2.2s_infinite]"
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              fontSize: 14,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
            </svg>
            Connect with GitLab
          </button>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
