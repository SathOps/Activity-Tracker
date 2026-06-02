import { useEffect, useState } from 'react';
import { getGitlabLoginUrl } from '../../services/api/auth';
import { updateMyProfile } from '../../services/api/profile';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useConfigStore } from '../../stores/configStore';
import { useRouter } from '../../lib/router';
import { Spinner } from '../ui/Spinner';

export function ProfileCompletionPage() {
  const { user, needsProfileSetup, logout } = useAuth();
  const corpusToken = useConfigStore((state) => state.corpusToken);
  const queryClient = useQueryClient();
  const { navigate } = useRouter();

  const [gitlabUsername, setGitlabUsername] = useState('');
  const [globalUsername, setGlobalUsername] = useState('');
  const [globalEmail, setGlobalEmail] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!corpusToken.trim()) {
      return;
    }
    setGitlabUsername(user?.gitlabUsername ?? '');
    setGlobalUsername(user?.globalUsername ?? '');
    setGlobalEmail(user?.globalEmail ?? '');
    setDateOfJoining(user?.dateOfJoining ?? '');
    setLoadingProfile(false);
  }, [
    corpusToken,
    user?.dateOfJoining,
    user?.gitlabUsername,
    user?.globalEmail,
    user?.globalUsername,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gitlabUsername.trim()) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateMyProfile({
        gitlab_username: gitlabUsername.trim(),
        ...(globalUsername.trim() && {
          global_username: globalUsername.trim(),
        }),
        ...(globalEmail.trim() && { global_email: globalEmail.trim() }),
        ...(dateOfJoining && { date_of_joining: dateOfJoining }),
      });

      queryClient.invalidateQueries({ queryKey: ['session'] });

      if (needsProfileSetup) {
        // First-time setup: redirect to GitLab OIDC
        window.location.href = getGitlabLoginUrl();
      } else {
        // Edit mode: stay on page, confirm success, then go back to profile
        setSuccessMsg('Profile updated successfully.');
        setTimeout(() => navigate('/my-profile'), 1200);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to save profile'
      );
      setSaving(false);
    }
  }

  const isSetupMode = needsProfileSetup;

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading profile…" />
      </div>
    );
  }

  const pageContent = (
    <section className="portal-login-panel">
      <div className="portal-login-panel-header">
        <p className="portal-login-panel-kicker">
          {isSetupMode ? `Welcome, ${user?.name ?? 'intern'}` : 'Edit Profile'}
        </p>
        <h2 className="portal-login-panel-title">
          {isSetupMode ? 'Complete your profile' : 'Update your details'}
        </h2>
        <p className="portal-login-panel-copy">
          {isSetupMode
            ? 'Set your GitLab username to proceed. You will be redirected to GitLab to authorise the connection.'
            : 'Update your GitLab username and optional details below. Fields auto-filled from Corpus cannot be changed here.'}
        </p>
      </div>

      <form className="portal-login-form" onSubmit={handleSubmit}>
        <label className="portal-login-field" htmlFor="profile-gitlab-username">
          <span className="portal-login-label">
            GitLab Username
            <span aria-hidden="true" style={{ color: '#ef4444' }}>
              {' '}
              *
            </span>
          </span>
          <input
            id="profile-gitlab-username"
            type="text"
            value={gitlabUsername}
            onChange={(e) => setGitlabUsername(e.target.value)}
            className="portal-login-input"
            placeholder="your_gitlab_username"
            required
            autoComplete="username"
          />
        </label>

        <label className="portal-login-field" htmlFor="profile-global-username">
          <span className="portal-login-label">Global Username (optional)</span>
          <input
            id="profile-global-username"
            type="text"
            value={globalUsername}
            onChange={(e) => setGlobalUsername(e.target.value)}
            className="portal-login-input"
            placeholder="e.g. GitHub handle"
          />
        </label>

        <label className="portal-login-field" htmlFor="profile-global-email">
          <span className="portal-login-label">Personal Email (optional)</span>
          <input
            id="profile-global-email"
            type="email"
            value={globalEmail}
            onChange={(e) => setGlobalEmail(e.target.value)}
            className="portal-login-input"
            placeholder="you@personal.com"
          />
        </label>

        <label className="portal-login-field" htmlFor="profile-date-of-joining">
          <span className="portal-login-label">Date of Joining (optional)</span>
          <input
            id="profile-date-of-joining"
            type="date"
            value={dateOfJoining}
            onChange={(e) => setDateOfJoining(e.target.value)}
            className="portal-login-input"
          />
        </label>

        {error && <p className="portal-login-error">{error}</p>}
        {successMsg && (
          <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>
            {successMsg}
          </p>
        )}
        {!error && !successMsg && (
          <p className="portal-login-hint">
            {isSetupMode
              ? 'You will be redirected to GitLab to complete the connection after saving.'
              : 'Name, email and institution are managed by Corpus and cannot be edited here.'}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !gitlabUsername.trim()}
          className="portal-login-submit"
        >
          {saving
            ? 'Saving…'
            : isSetupMode
              ? 'Save & Connect GitLab'
              : 'Save Changes'}
        </button>

        {isSetupMode ? (
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#64748b',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Sign out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/my-profile')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#64748b',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Cancel
          </button>
        )}
      </form>
    </section>
  );

  // First-time setup: full-page login shell
  if (isSetupMode) {
    return (
      <main className="portal-login-page">
        <div className="portal-login-backdrop" aria-hidden="true" />
        <div className="portal-login-shell">
          <section className="portal-login-hero">
            <p className="portal-login-eyebrow">Internship Activity Tracker</p>
            <h1 className="portal-login-title">Complete your profile</h1>
            <p className="portal-login-copy">
              Connect your GitLab account to unlock compliance tools. Your
              GitLab username links your activity data and enables the full
              workspace.
            </p>
          </section>
          {pageContent}
        </div>
      </main>
    );
  }

  // Edit mode: plain card (rendered inside Layout by App.tsx)
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your editable profile fields.
        </p>
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '28px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {pageContent}
      </div>
    </div>
  );
}
