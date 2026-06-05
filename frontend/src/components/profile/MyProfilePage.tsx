import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../lib/router';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types';

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.06em]">
        {label}
      </span>
      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium break-all">
        {value != null && value !== '' ? String(value) : '—'}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const badgeClasses: Record<UserRole, string> = {
    admin:
      'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30',
    mentor:
      'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30',
    intern:
      'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
  };
  const cls = badgeClasses[role] ?? badgeClasses.intern;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.06em] ${cls}`}
    >
      {role}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-3xl font-bold text-white shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

export function MyProfilePage() {
  const { user, isLoading } = useAuth();
  const { navigate } = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading profile…" />
      </div>
    );
  }

  if (!user) return null;

  // Combine redundant name and ID fields
  const displayInstitution =
    user.institutionName && user.institutionId
      ? `${user.institutionName} (ID: ${user.institutionId})`
      : user.institutionName || user.institutionId;

  const displayTeam =
    user.teamName && user.teamId
      ? `${user.teamName} (ID: ${user.teamId})`
      : user.teamName || user.teamId;

  const displayBatch =
    user.batchName && user.batchId
      ? `${user.batchName} (ID: ${user.batchId})`
      : user.batchName || user.batchId;

  return (
    <div className="max-w-[680px] mx-auto px-4 py-2">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-6 rounded-2xl bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 backdrop-blur-xl mb-5 shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all">
        <Avatar name={user.name} />
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3 className="m-0 mb-1 text-[22px] font-bold text-slate-900 dark:text-slate-50 font-display">
            {user.name}
          </h3>
          <p className="m-0 mb-2.5 text-sm text-slate-500 dark:text-slate-400">
            @{user.corpusUsername}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <RoleBadge role={user.role} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile-setup')}
          className="px-[18px] py-2 rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/30 dark:bg-slate-850/30 text-[#475569] dark:text-slate-300 text-[13px] font-medium cursor-pointer whitespace-nowrap hover:bg-white/55 dark:hover:bg-slate-800/50 transition-colors backdrop-blur-sm shadow-sm"
        >
          Edit Profile
        </button>
      </div>

      {/* Info sections */}
      <div className="grid gap-4">
        {/* Account */}
        <section className="bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 backdrop-blur-xl rounded-[14px] p-5 sm:p-6 shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h4 className="m-0 mb-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            Account
          </h4>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="ID" value={user.id} />
            <Field label="Email" value={user.email} />
            <Field label="Institution" value={displayInstitution} />
            <Field label="Date of Joining" value={user.dateOfJoining} />
          </div>
        </section>

        {/* Team & Batch */}
        <section className="bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 backdrop-blur-xl rounded-[14px] p-5 sm:p-6 shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h4 className="m-0 mb-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            Team &amp; Batch
          </h4>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Team" value={displayTeam} />
            <Field label="Batch" value={displayBatch} />
          </div>
        </section>

        {/* GitLab / Global */}
        <section className="bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 backdrop-blur-xl rounded-[14px] p-5 sm:p-6 shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h4 className="m-0 mb-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            GitLab &amp; Global
          </h4>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="GitLab Username" value={user.gitlabUsername} />
            <Field label="Global Username" value={user.globalUsername} />
            <Field label="Global Email" value={user.globalEmail} />
          </div>
        </section>
      </div>
    </div>
  );
}
