import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../../api';
import { useConfigStore } from '../../stores/configStore';
import { useRouter } from '../../lib/router';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
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
  const corpusToken = useConfigStore((state) => state.corpusToken);
  const { navigate } = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['me', corpusToken],
    queryFn: getMyProfile,
    enabled: !!corpusToken.trim(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading profile…" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" title="Could not load profile">
        {(error as Error).message}
      </Alert>
    );
  }

  if (!data) return null;

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
        <Avatar name={data.name} />
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
            {data.name}
          </h3>
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#64748b' }}>
            @{data.corpus_username}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoleBadge role={data.role} />
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
            <Field label="ID" value={data.id} />
            <Field label="Corpus Username" value={data.corpus_username} />
            <Field label="Email" value={data.email} />
            <Field label="Institution" value={data.institution_name} />
            <Field label="Institution ID" value={data.institution_id} />
            <Field label="Date of Joining" value={data.date_of_joining} />
          </div>
        </section>

        {/* Team & Batch */}
        <section className="profile-section">
          <h4 className="profile-section-title">Team &amp; Batch</h4>
          <div className="profile-fields">
            <Field label="Team" value={data.team_name} />
            <Field label="Team ID" value={data.team_id} />
            <Field label="Batch" value={data.batch_name} />
            <Field label="Batch ID" value={data.batch_id} />
          </div>
        </section>

        {/* GitLab / Global */}
        <section className="profile-section">
          <h4 className="profile-section-title">GitLab &amp; Global</h4>
          <div className="profile-fields">
            <Field label="GitLab Username" value={data.gitlab_username} />
            <Field label="Global Username" value={data.global_username} />
            <Field label="Global Email" value={data.global_email} />
          </div>
        </section>
      </div>
    </div>
  );
}
