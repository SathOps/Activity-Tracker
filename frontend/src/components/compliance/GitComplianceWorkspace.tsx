import { useAuth } from '../../contexts/AuthContext';
import { getGitlabLoginUrl } from '../../api';

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
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-3xl space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Git Compliance Checker
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            Connect GitLab to open compliance tools
          </h2>
          <p className="text-base leading-7 text-slate-600">
            Authorise your GitLab account via OAuth to unlock profile, weekly
            performance, mentor groups, batch analytics, and leaderboard views.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = getGitlabLoginUrl();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
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
