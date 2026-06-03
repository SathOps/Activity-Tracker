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
    <section
      className={
        isSetupMode
          ? 'mx-auto lg:mx-0 w-full max-w-[480px] self-center bg-white/75 backdrop-blur-[20px] border border-white/70 rounded-[24px] sm:rounded-[30px] p-6 sm:p-9 shadow-[0_26px_70px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]'
          : 'w-full'
      }
    >
      <div className="border-b border-[rgba(215,226,242,0.9)] mb-6 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c85a9] mb-2.5 font-display">
          {isSetupMode ? `Welcome, ${user?.name ?? 'intern'}` : 'Edit Profile'}
        </p>
        <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] text-[#13233f] mb-2.5 font-display">
          {isSetupMode ? 'Complete your profile' : 'Update your details'}
        </h2>
        <p className="text-[15px] leading-[1.75] text-[#5a6b87] m-0">
          {isSetupMode
            ? 'Set your GitLab username to proceed. You will be redirected to GitLab to authorise the connection.'
            : 'Update your GitLab username and optional details below. Fields auto-filled from Corpus cannot be changed here.'}
        </p>
      </div>

      <form className="grid gap-[18px]" onSubmit={handleSubmit}>
        <label
          className="grid gap-2 text-[#243752]"
          htmlFor="profile-gitlab-username"
        >
          <span className="text-xs font-semibold tracking-[0.03em]">
            GitLab Username
            <span aria-hidden="true" className="text-red-500 ml-1">
              *
            </span>
          </span>
          <input
            id="profile-gitlab-username"
            type="text"
            value={gitlabUsername}
            onChange={(e) => setGitlabUsername(e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-2xl bg-[#f7faff]/95 border border-[#bed0e9]/95 text-[#13233f] text-[15px] placeholder-[#8b9bb4] focus:bg-white focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/16 focus:outline-none transition-all duration-200"
            placeholder="your_gitlab_username"
            required
            autoComplete="username"
          />
        </label>

        <label
          className="grid gap-2 text-[#243752]"
          htmlFor="profile-global-username"
        >
          <span className="text-xs font-semibold tracking-[0.03em]">
            Global Username (optional)
          </span>
          <input
            id="profile-global-username"
            type="text"
            value={globalUsername}
            onChange={(e) => setGlobalUsername(e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-2xl bg-[#f7faff]/95 border border-[#bed0e9]/95 text-[#13233f] text-[15px] placeholder-[#8b9bb4] focus:bg-white focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/16 focus:outline-none transition-all duration-200"
            placeholder="e.g. GitHub handle"
          />
        </label>

        <label
          className="grid gap-2 text-[#243752]"
          htmlFor="profile-global-email"
        >
          <span className="text-xs font-semibold tracking-[0.03em]">
            Personal Email (optional)
          </span>
          <input
            id="profile-global-email"
            type="email"
            value={globalEmail}
            onChange={(e) => setGlobalEmail(e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-2xl bg-[#f7faff]/95 border border-[#bed0e9]/95 text-[#13233f] text-[15px] placeholder-[#8b9bb4] focus:bg-white focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/16 focus:outline-none transition-all duration-200"
            placeholder="you@personal.com"
          />
        </label>

        <label
          className="grid gap-2 text-[#243752]"
          htmlFor="profile-date-of-joining"
        >
          <span className="text-xs font-semibold tracking-[0.03em]">
            Date of Joining (optional)
          </span>
          <input
            id="profile-date-of-joining"
            type="date"
            value={dateOfJoining}
            onChange={(e) => setDateOfJoining(e.target.value)}
            className="w-full min-h-[56px] px-4 rounded-2xl bg-[#f7faff]/95 border border-[#bed0e9]/95 text-[#13233f] text-[15px] placeholder-[#8b9bb4] focus:bg-white focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/16 focus:outline-none transition-all duration-200"
          />
        </label>

        {error && (
          <p className="bg-[#fff1f3] border border-[#f4c1c8] rounded-[14px] text-[#8f2532] text-xs leading-[1.6] m-0 p-[12px_14px]">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="text-[13px] text-green-600 m-0">{successMsg}</p>
        )}
        {!error && !successMsg && (
          <p className="text-[#6b7f9d] text-[13px] leading-[1.6] m-0">
            {isSetupMode
              ? 'You will be redirected to GitLab to complete the connection after saving.'
              : 'Name, email and institution are managed by Corpus and cannot be edited here.'}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !gitlabUsername.trim()}
          className="w-full min-h-[58px] rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] border-none text-white text-[15px] font-bold font-display tracking-[0.01em] px-[18px] shadow-[0_16px_34px_rgba(37,99,235,0.24)] hover:enabled:shadow-[0_20px_38px_rgba(37,99,235,0.3)] hover:enabled:-translate-y-[1px] disabled:opacity-[0.68] disabled:cursor-wait transition-all duration-[180ms]"
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
            className="bg-transparent border-none cursor-pointer text-[13px] text-slate-500 underline p-0 hover:text-slate-700 transition-colors self-start"
          >
            Sign out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/my-profile')}
            className="bg-transparent border-none cursor-pointer text-[13px] text-slate-500 underline p-0 hover:text-slate-700 transition-colors self-start"
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
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.14),transparent_30%),linear-gradient(135deg,#eef2ff_0%,#e0e7ff_45%,#dbeafe_100%)] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center">
          <div className="grid w-full gap-6 lg:grid-cols-2">
            <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#0b1020_0%,#12264c_55%,#13203a_100%)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                  Internship Activity Tracker
                </p>
                <h1 className="mt-6 max-w-[11ch] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl lg:text-[4.8rem]">
                  Complete your profile
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                  Connect your GitLab account to unlock compliance tools. Your
                  GitLab username links your activity data and enables the full
                  workspace.
                </p>
              </div>
            </section>
            {pageContent}
          </div>
        </div>
      </main>
    );
  }

  // Edit mode: plain card (rendered inside Layout by App.tsx)
  return (
    <div className="max-w-[560px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your editable profile fields.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-sm">
        {pageContent}
      </div>
    </div>
  );
}
