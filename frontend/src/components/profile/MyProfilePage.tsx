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
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em]">
        {label}
      </span>
      <span className="text-sm text-slate-800 font-medium break-all">
        {value != null && value !== '' ? String(value) : '—'}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const colours: Record<UserRole, { bg: string; text: string }> = {
    admin: { bg: '#fee2e2', text: '#991b1b' },
    mentor: { bg: '#dbeafe', text: '#1e40af' },
    intern: { bg: '#d1fae5', text: '#065f46' },
  };
  const c = colours[role] ?? colours.intern;
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.06em]"
      style={{
        background: c.bg,
        color: c.text,
      }}
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
    <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shrink-0">
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

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your account information pulled from the backend.
        </p>
      </div>

      {/* Header card */}
      <div className="flex items-center gap-5 p-6 rounded-2xl bg-white border border-slate-200 mb-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <Avatar name={user.name} />
        <div className="flex-1 min-w-0">
          <h3 className="m-0 mb-1 text-[22px] font-bold text-slate-900 font-display">
            {user.name}
          </h3>
          <p className="m-0 mb-2 text-sm text-slate-500">
            @{user.corpusUsername}
          </p>
          <div className="flex items-center gap-2.5">
            <RoleBadge role={user.role} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile-setup')}
          className="px-[18px] py-2 rounded-xl border border-slate-200 bg-slate-50 text-[#475569] text-[13px] font-medium cursor-pointer whitespace-nowrap hover:bg-slate-100 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      {/* Info sections */}
      <div className="grid gap-4">
        {/* Account */}
        <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h4 className="m-0 mb-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Account
          </h4>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-x-6 gap-y-3">
            <Field label="ID" value={user.id} />
            <Field label="Corpus Username" value={user.corpusUsername} />
            <Field label="Email" value={user.email} />
            <Field label="Institution" value={user.institutionName} />
            <Field label="Institution ID" value={user.institutionId} />
            <Field label="Date of Joining" value={user.dateOfJoining} />
          </div>
        </section>

        {/* Team & Batch */}
        <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h4 className="m-0 mb-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Team &amp; Batch
          </h4>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Team" value={user.teamName} />
            <Field label="Team ID" value={user.teamId} />
            <Field label="Batch" value={user.batchName} />
            <Field label="Batch ID" value={user.batchId} />
          </div>
        </section>

        {/* GitLab / Global */}
        <section className="bg-white border border-slate-200 rounded-[14px] p-5 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h4 className="m-0 mb-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">
            GitLab &amp; Global
          </h4>
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-x-6 gap-y-3">
            <Field label="GitLab Username" value={user.gitlabUsername} />
            <Field label="Global Username" value={user.globalUsername} />
            <Field label="Global Email" value={user.globalEmail} />
          </div>
        </section>
      </div>
    </div>
  );
}
