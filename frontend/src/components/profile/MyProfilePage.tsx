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
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">
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
      style={{
        display: 'inline-block',
        padding: '3px 12px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
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
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
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
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your account information pulled from the backend.
        </p>
      </div>

      {/* Header card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '24px',
          borderRadius: 16,
          background: '#fff',
          border: '1px solid #e2e8f0',
          marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <Avatar name={user.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
              fontFamily: 'var(--font-display)',
            }}
          >
            {user.name}
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#64748b' }}>
            @{user.corpusUsername}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile-setup')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            color: '#475569',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Edit Profile
        </button>
      </div>

      {/* Info sections */}
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Account */}
        <section className="profile-section">
          <h4 className="profile-section-title">Account</h4>
          <div className="profile-fields">
            <Field label="ID" value={user.id} />
            <Field label="Corpus Username" value={user.corpusUsername} />
            <Field label="Email" value={user.email} />
            <Field label="Institution" value={user.institutionName} />
            <Field label="Institution ID" value={user.institutionId} />
            <Field label="Date of Joining" value={user.dateOfJoining} />
          </div>
        </section>

        {/* Team & Batch */}
        <section className="profile-section">
          <h4 className="profile-section-title">Team &amp; Batch</h4>
          <div className="profile-fields">
            <Field label="Team" value={user.teamName} />
            <Field label="Team ID" value={user.teamId} />
            <Field label="Batch" value={user.batchName} />
            <Field label="Batch ID" value={user.batchId} />
          </div>
        </section>

        {/* GitLab / Global */}
        <section className="profile-section">
          <h4 className="profile-section-title">GitLab &amp; Global</h4>
          <div className="profile-fields">
            <Field label="GitLab Username" value={user.gitlabUsername} />
            <Field label="Global Username" value={user.globalUsername} />
            <Field label="Global Email" value={user.globalEmail} />
          </div>
        </section>
      </div>
    </div>
  );
}
