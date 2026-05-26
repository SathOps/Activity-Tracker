import { useHealth } from '../../hooks/useHealth';
import { useConfigStore } from '../../stores/configStore';

interface Props {
  children: React.ReactNode;
}

export function GitComplianceWorkspace({ children }: Props) {
  const gitlabToken = useConfigStore((state) => state.gitlabToken).trim();
  const { isLoading, isError } = useHealth();

  if (!gitlabToken) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Git Compliance Checker
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            Connect GitLab to open compliance tools
          </h2>
          <p className="text-base leading-7 text-slate-600">
            Use the GitLab URL and personal access token in the sidebar. After
            validation, profile, weekly performance, batch analytics,
            leaderboard, and roster views will be available here.
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">
            Git Compliance Checker
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            Verifying GitLab access
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Hold on while the GitLab token is being validated.
          </p>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-red-500">
            Git Compliance Checker
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            GitLab token validation failed
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Update the GitLab login details in the sidebar and retry. The
            compliance workspace stays locked until the token is accepted.
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
