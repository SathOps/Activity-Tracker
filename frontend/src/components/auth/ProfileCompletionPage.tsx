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
  const { navigate, pathname } = useRouter();

  const [gitlabUsername, setGitlabUsername] = useState('');
  const [globalUsername, setGlobalUsername] = useState('');
  const [globalEmail, setGlobalEmail] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [step, setStep] = useState(1);

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
    if (isSetupMode && step === 1) {
      if (gitlabUsername.trim() && dateOfJoining) {
        setStep(2);
      }
      return;
    }
    if (!gitlabUsername.trim() || (isSetupMode && !dateOfJoining)) return;

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

  const isSetupMode =
    needsProfileSetup ||
    (import.meta.env.DEV &&
      pathname === '/profile-setup' &&
      new URLSearchParams(window.location.search).get('setup') === 'true');

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" label="Loading profile…" />
      </div>
    );
  }

  const pageContent = (
    <section className="w-full">
      <div className="border-b border-[rgba(215,226,242,0.9)] mb-6 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c85a9] mb-2.5 font-display">
          Edit Profile
        </p>
        <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] text-[#13233f] mb-2.5 font-display">
          Update your details
        </h2>
        <p className="text-[15px] leading-[1.75] text-[#5a6b87] m-0">
          Update your GitLab username and optional details below. Fields
          auto-filled from Corpus cannot be changed here.
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
            Name, email and institution are managed by Corpus and cannot be
            edited here.
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !gitlabUsername.trim()}
          className="w-full min-h-[58px] rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] border-none text-white text-[15px] font-bold font-display tracking-[0.01em] px-[18px] shadow-[0_16px_34px_rgba(37,99,235,0.24)] hover:enabled:shadow-[0_20px_38px_rgba(37,99,235,0.3)] hover:enabled:-translate-y-[1px] disabled:opacity-[0.68] disabled:cursor-wait transition-all duration-[180ms]"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/my-profile')}
          className="bg-transparent border-none cursor-pointer text-[13px] text-slate-500 underline p-0 hover:text-slate-700 transition-colors self-start"
        >
          Cancel
        </button>
      </form>
    </section>
  );

  // First-time setup: full-page login shell
  if (isSetupMode) {
    return (
      <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden p-0 font-body bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_60%_10%,rgba(14,165,233,0.1),transparent_30%),linear-gradient(135deg,#eef0fa_0%,#e8ecf5_40%,#eff0fa_100%)] bg-[size:200%_200%] animate-[login-gradient-shift_15s_ease_infinite]">
        <div
          className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_40%),linear-gradient(315deg,rgba(37,99,235,0.08),transparent_38%)]"
          aria-hidden="true"
        />
        <div className="relative w-screen h-screen overflow-hidden z-10 max-[800px]:flex max-[800px]:flex-col max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:w-full max-[800px]:overflow-visible">
          {/* Left Section (Hero) - Hidden on Mobile */}
          <section className="absolute left-0 top-0 w-[65vw] h-full z-[2] flex flex-col justify-center gap-12 p-[60px_48px] text-[#f8fbff] bg-[linear-gradient(145deg,rgba(11,18,32,0.98),rgba(17,45,92,0.96)),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] [clip-path:polygon(0_0,100%_0,80%_100%,0_100%)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-[1024px]:min-[801px]:w-[65vw] max-[1024px]:min-[801px]:p-[50px_36px] max-[800px]:hidden">
            <div
              className="absolute -right-[80px] -top-[60px] w-[320px] h-[320px] pointer-events-none bg-[radial-gradient(circle,rgba(96,165,250,0.22),transparent_60%)]"
              aria-hidden="true"
            />

            <div className="relative z-10 pr-[12%] max-[800px]:pr-0">
              <p className="text-[#b7ccf6] font-display text-[12px] font-bold tracking-[0.18em] uppercase m-0 mb-2 max-w-[600px] mr-auto">
                Internship Activity Tracker
              </p>
              <h1 className="text-white font-display text-[clamp(2.2rem,3.2vw,3.8rem)] font-bold tracking-[-0.04em] leading-[1.05] m-0 mb-3 max-w-[18ch] max-[1024px]:min-[801px]:text-[clamp(1.8rem,2.5vw,2.6rem)] max-[800px]:text-[2.2rem] max-[800px]:max-w-full">
                Complete your profile to proceed.
              </h1>
              <p className="text-[rgba(228,238,255,0.9)] text-[15px] leading-[1.6] m-0 mb-4 max-w-[500px] relative z-10 mr-auto">
                Set your GitLab username to proceed. Your GitLab username links
                your activity data and enables the full workspace.
              </p>

              <div className="grid grid-cols-2 gap-5 mt-3 relative z-10 max-w-[640px] mr-auto max-[1024px]:min-[801px]:gap-3 max-[1024px]:min-[801px]:pt-5 max-[800px]:grid-cols-1 max-[800px]:gap-3 max-[800px]:pt-8 max-[800px]:max-w-full">
                <article className="group relative flex flex-col p-[22px] rounded-2xl cursor-pointer backdrop-blur-md bg-[linear-gradient(135deg,rgba(15,23,42,0.4)_0%,rgba(30,41,59,0.2)_100%)] border border-[rgba(147,197,253,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-400 hover:-translate-y-2 hover:scale-[1.03] hover:border-[rgba(96,165,250,0.4)] hover:bg-[linear-gradient(135deg,rgba(20,30,55,0.6)_0%,rgba(37,99,235,0.1)_100%)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden [animation:card-entrance_0.8s_cubic-bezier(0.16,1,0.3,1)_both,card-idle-float_6s_infinite_ease-in-out_alternate] max-[1024px]:min-[801px]:p-3.5 max-[800px]:p-5 max-[800px]:rounded-xl">
                  <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -skew-x-[20deg] transition-none group-hover:left-[150%] group-hover:duration-800 group-hover:ease-in-out" />
                  <span className="inline-flex w-fit px-3 py-1.5 mb-[14px] font-display text-[11px] font-bold tracking-[0.12em] text-[#93c5fd] bg-[rgba(96,165,250,0.1)] border border-[rgba(147,197,253,0.15)] rounded-full transition-all duration-300 group-hover:bg-[rgba(96,165,250,0.25)] group-hover:border-[rgba(147,197,253,0.4)] group-hover:text-white group-hover:shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                    01
                  </span>
                  <h2 className="text-white font-display text-[19px] font-semibold m-0 mb-2.5 transition-colors duration-300 group-hover:text-[#60a5fa]">
                    Profile Setup
                  </h2>
                  <p className="text-[#94a3b8] text-[13.5px] leading-[1.6] m-0 transition-colors duration-300 group-hover:text-[#e2e8f0]">
                    Provide your GitLab username and other details to complete
                    your registration in the activity tracker.
                  </p>
                </article>

                <article className="group relative flex flex-col p-[22px] rounded-2xl cursor-pointer backdrop-blur-md bg-[linear-gradient(135deg,rgba(15,23,42,0.4)_0%,rgba(30,41,59,0.2)_100%)] border border-[rgba(147,197,253,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-400 hover:-translate-y-2 hover:scale-[1.03] hover:border-[rgba(96,165,250,0.4)] hover:bg-[linear-gradient(135deg,rgba(20,30,55,0.6)_0%,rgba(37,99,235,0.1)_100%)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden [animation:card-entrance_0.8s_cubic-bezier(0.16,1,0.3,1)_both,card-idle-float_6s_infinite_ease-in-out_alternate] max-[1024px]:min-[801px]:p-3.5 max-[800px]:p-5 max-[800px]:rounded-xl">
                  <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -skew-x-[20deg] transition-none group-hover:left-[150%] group-hover:duration-800 group-hover:ease-in-out" />
                  <span className="inline-flex w-fit px-3 py-1.5 mb-[14px] font-display text-[11px] font-bold tracking-[0.12em] text-[#93c5fd] bg-[rgba(96,165,250,0.1)] border border-[rgba(147,197,253,0.15)] rounded-full transition-all duration-300 group-hover:bg-[rgba(96,165,250,0.25)] group-hover:border-[rgba(147,197,253,0.4)] group-hover:text-white group-hover:shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                    02
                  </span>
                  <h2 className="text-white font-display text-[19px] font-semibold m-0 mb-2.5 transition-colors duration-300 group-hover:text-[#60a5fa]">
                    GitLab Verification
                  </h2>
                  <p className="text-[#94a3b8] text-[13.5px] leading-[1.6] m-0 transition-colors duration-300 group-hover:text-[#e2e8f0]">
                    Authorize via GitLab OIDC to securely link your profile and
                    start submitting daily standups.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* Right Section (Form) */}
          <section className="absolute right-0 top-0 w-screen h-full z-[1] flex flex-col items-center justify-center pl-[68vw] pr-[4vw] py-0 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%,#f1f5f9_100%)] overflow-hidden max-[1024px]:min-[801px]:pl-[68vw] max-[1024px]:min-[801px]:pr-[4vw] max-[800px]:relative max-[800px]:w-full max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:flex max-[800px]:items-center max-[800px]:justify-start max-[800px]:pt-12 max-[800px]:pb-16 max-[800px]:px-6 max-[800px]:bg-[linear-gradient(to_bottom,#eff2f9_0%,#f8fafc_15%,#f8fafc_100%)] max-[800px]:overflow-y-auto">
            <div className="w-full max-w-[380px] flex flex-col gap-0 animate-[panel-fade-in_0.6s_cubic-bezier(0.16,1,0.3,1)_both] max-[800px]:max-w-[440px] max-[800px]:py-8 max-[800px]:my-auto max-[800px]:mx-auto">
              {/* Mobile Brand Header */}
              <div className="hidden max-[800px]:flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3b82f6_100%)] flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 animate-[pulse-border_2s_infinite_ease-in-out]">
                  <svg
                    className="text-white"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-indigo-600 font-display text-[10px] font-bold tracking-[0.18em] uppercase">
                  Swecha Internship
                </span>
                <h1 className="text-[#0f172a] font-display text-base font-bold tracking-tight mt-0.5">
                  Activity Tracker
                </h1>
              </div>

              <div className="w-12 h-1 rounded border-none bg-[linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc)] bg-[size:200%_100%] animate-[accent-shimmer_3s_ease-in-out_infinite] mb-5 max-[800px]:mx-auto max-[800px]:mb-6" />

              <div className="mb-7 max-[800px]:mb-5 max-[800px]:text-center">
                {step === 1 ? (
                  <>
                    <span className="text-indigo-600 font-display text-xs font-bold tracking-wide uppercase block mb-1">
                      Welcome, {user?.name ?? 'intern'}
                    </span>
                    <h2 className="text-[#0f172a] font-display text-[clamp(26px,2.5vw,32px)] font-bold tracking-[-0.03em] leading-[1.15] m-0 mb-2 max-[800px]:text-[26px]">
                      Complete Profile
                    </h2>
                    <p className="text-[#64748b] text-[14.5px] leading-[1.6] m-0">
                      Set your GitLab username to complete
                      <br />
                      registration and connect your profile.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-indigo-600 font-display text-xs font-bold tracking-wide uppercase block mb-1">
                      Additional Info
                    </span>
                    <h2 className="text-[#0f172a] font-display text-[clamp(26px,2.5vw,32px)] font-bold tracking-[-0.03em] leading-[1.15] m-0 mb-2 max-[800px]:text-[26px]">
                      Optional Details
                    </h2>
                    <p className="text-[#64748b] text-[14.5px] leading-[1.6] m-0">
                      Provide optional details below or
                      <br />
                      save to finish the setup process.
                    </p>
                  </>
                )}
              </div>

              {/* Progress Indicator for Wizard */}
              <div className="flex flex-col items-center justify-center mb-6 w-full">
                <div className="relative w-full max-w-[140px] flex items-center justify-center">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="absolute left-0 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all duration-150 rounded-lg focus:outline-none"
                      title="Back to step 1"
                      aria-label="Back to step 1"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                    </button>
                  )}
                  <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                    Step {step} of 2
                  </span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <div
                    className={`w-8 h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'bg-indigo-600' : 'bg-indigo-600/30'}`}
                  />
                  <div
                    className={`w-8 h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  />
                </div>
              </div>

              <form className="grid gap-5 w-full" onSubmit={handleSubmit}>
                {step === 1 && (
                  <>
                    <div className="grid gap-1.5 w-full">
                      <label
                        className="text-xs font-bold text-slate-700 tracking-wide"
                        htmlFor="profile-gitlab-username"
                      >
                        GitLab Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="profile-gitlab-username"
                          type="text"
                          value={gitlabUsername}
                          onChange={(e) => setGitlabUsername(e.target.value)}
                          className="w-full min-h-[52px] bg-white border-[1.5px] border-[#e2e8f0] rounded-xl text-[#0f172a] text-sm pl-11 pr-4 transition-all duration-200 focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus:outline-none"
                          placeholder="your_gitlab_username"
                          required
                          autoComplete="username"
                        />
                        <svg
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none transition-all duration-200"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid gap-1.5 w-full">
                      <label
                        className="text-xs font-bold text-slate-700 tracking-wide"
                        htmlFor="profile-date-of-joining"
                      >
                        Date of Joining <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="profile-date-of-joining"
                          type="date"
                          value={dateOfJoining}
                          onChange={(e) => setDateOfJoining(e.target.value)}
                          className="w-full min-h-[52px] bg-white border-[1.5px] border-[#e2e8f0] rounded-xl text-[#0f172a] text-sm pl-11 pr-4 transition-all duration-200 focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus:outline-none"
                          required
                        />
                        <svg
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none transition-all duration-200"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!gitlabUsername.trim() || !dateOfJoining}
                      className="group/btn relative flex items-center justify-center gap-2 w-full min-h-[48px] px-5 mt-2 rounded-xl text-white font-display text-[14px] font-bold tracking-[0.01em] bg-[linear-gradient(135deg,#0b1530_0%,#1e3b8a_50%,#2563eb_100%)] shadow-[0_4px_14px_rgba(30,58,138,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:enabled:shadow-[0_8px_24px_rgba(30,58,138,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:enabled:-translate-y-[1.5px] active:enabled:translate-y-0 disabled:opacity-65 disabled:cursor-wait overflow-hidden cursor-pointer border-none"
                    >
                      <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] -skew-x-[25deg] pointer-events-none animate-[button-shimmer_6s_infinite_ease-in-out] group-hover/btn:animate-[button-shimmer_1.5s_infinite_ease-in-out]" />
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        <span>Next Step</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid gap-1.5 w-full">
                      <label
                        className="text-xs font-bold text-slate-700 tracking-wide"
                        htmlFor="profile-global-username"
                      >
                        Global Username (optional)
                      </label>
                      <div className="relative">
                        <input
                          id="profile-global-username"
                          type="text"
                          value={globalUsername}
                          onChange={(e) => setGlobalUsername(e.target.value)}
                          className="w-full min-h-[52px] bg-white border-[1.5px] border-[#e2e8f0] rounded-xl text-[#0f172a] text-sm pl-11 pr-4 transition-all duration-200 focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus:outline-none"
                          placeholder="e.g. GitHub handle"
                        />
                        <svg
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none transition-all duration-200"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid gap-1.5 w-full">
                      <label
                        className="text-xs font-bold text-slate-700 tracking-wide"
                        htmlFor="profile-global-email"
                      >
                        Personal Email (optional)
                      </label>
                      <div className="relative">
                        <input
                          id="profile-global-email"
                          type="email"
                          value={globalEmail}
                          onChange={(e) => setGlobalEmail(e.target.value)}
                          className="w-full min-h-[52px] bg-white border-[1.5px] border-[#e2e8f0] rounded-xl text-[#0f172a] text-sm pl-11 pr-4 transition-all duration-200 focus:bg-white focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] focus:outline-none"
                          placeholder="you@personal.com"
                        />
                        <svg
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none transition-all duration-200"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                    </div>

                    {error && (
                      <p className="bg-[linear-gradient(135deg,#fef2f2,#fff1f2)] border border-[#fecdd3] rounded-[10px] text-[#be123c] text-[13px] leading-[1.6] m-0 p-[10px_14px]">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={
                        saving || !gitlabUsername.trim() || !dateOfJoining
                      }
                      className="group/btn relative flex items-center justify-center gap-2 w-full min-h-[48px] px-5 mt-2 rounded-xl text-white font-display text-[14px] font-bold tracking-[0.01em] bg-[linear-gradient(135deg,#0b1530_0%,#1e3b8a_50%,#2563eb_100%)] shadow-[0_4px_14px_rgba(30,58,138,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:enabled:shadow-[0_8px_24px_rgba(30,58,138,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:enabled:-translate-y-[1.5px] active:enabled:translate-y-0 disabled:opacity-65 disabled:cursor-wait overflow-hidden cursor-pointer border-none"
                    >
                      <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] -skew-x-[25deg] pointer-events-none animate-[button-shimmer_6s_infinite_ease-in-out] group-hover/btn:animate-[button-shimmer_1.5s_infinite_ease-in-out]" />
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        {saving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 rounded-full border-t-white animate-[portal-spin_0.8s_linear_infinite]" />
                            {'Saving…'}
                          </>
                        ) : (
                          <>
                            <span>Save & Connect GitLab</span>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="bg-transparent border-none cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors self-center text-center w-full mt-2"
                >
                  Sign out
                </button>
              </form>

              <div className="mt-6">
                <div className="h-[1px] bg-[linear-gradient(90deg,transparent,#e2e8f0,transparent)] mb-4" />
                <p className="text-[#94a3b8] text-[12px] leading-[1.5] m-0 mb-3 text-center">
                  You will be redirected to GitLab to complete the connection
                  after saving.
                </p>
              </div>

              {/* Mobile About Section Button & Toggle */}
              <div className="hidden max-[800px]:block mt-10 w-full text-center">
                <button
                  type="button"
                  onClick={() => setShowAbout(!showAbout)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95 focus:outline-none"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    {showAbout ? 'Hide About Platform' : 'About the Platform'}
                  </span>
                </button>

                {showAbout && (
                  <div className="flex flex-col gap-4 mt-6 text-left animate-[panel-fade-in_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <article className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50/80">
                          01
                        </span>
                        <h4 className="text-slate-900 font-display font-bold text-sm">
                          Profile Setup
                        </h4>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Provide your GitLab username and other details to
                        complete your registration in the activity tracker.
                      </p>
                    </article>

                    <article className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50/80">
                          02
                        </span>
                        <h4 className="text-slate-900 font-display font-bold text-sm">
                          GitLab Verification
                        </h4>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Authorize via GitLab OIDC to securely link your profile
                        and start submitting daily standups.
                      </p>
                    </article>
                  </div>
                )}
              </div>
            </div>
          </section>
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
