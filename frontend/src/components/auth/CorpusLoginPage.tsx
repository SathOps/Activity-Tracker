import { useEffect, useState } from 'react';
import { corpusLogin } from '../../services/api/auth';
import { useRouter } from '../../lib/router';
import { useConfigStore } from '../../stores/configStore';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

export function CorpusLoginPage() {
  const setCorpusToken = useConfigStore((state) => state.setCorpusToken);
  const setAccessToken = useConfigStore((state) => state.setAccessToken);
  const { navigate } = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Show any error from GitLab OIDC redirect (/login?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gitlabError = params.get('error');
    if (gitlabError) {
      setError(`GitLab login failed: ${gitlabError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone.trim() || !password.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('Connecting to server...');

    try {
      // Simulate multi-stage connection for visual clarity
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatusMessage('Authenticating with Corpus...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await corpusLogin(phone.trim(), password.trim());

      setStatusMessage('Finalizing session...');
      await new Promise((resolve) => setTimeout(resolve, 400));

      setAccessToken(response.access_token);
      setCorpusToken('session', response.username || phone.trim());
      setPassword('');
      queryClient.invalidateQueries({ queryKey: ['session'] });
      navigate('/standup');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Corpus login failed'
      );
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  }

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
                One portal for standup operations and Git compliance review.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Sign in with Corpus to enter a unified workspace. Standup
                Tracker handles daily submissions and verification, while Git
                Compliance Checker opens the GitLab-backed analytics and audit
                tools.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-slate-200">
                    01
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Standup Tracker
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Track standup uploads, verify team completion, review audio
                    evidence, and manage daily status from one operational
                    surface.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-slate-200">
                    02
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Git Compliance Checker
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Add GitLab access after login to inspect developer activity,
                    weekly trends, team rankings, batch analytics, and roster
                    data.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto lg:mx-0 w-full max-w-[480px] self-center bg-white/75 backdrop-blur-[20px] border border-white/70 rounded-[24px] sm:rounded-[30px] p-6 sm:p-9 shadow-[0_26px_70px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="border-b border-[rgba(215,226,242,0.9)] mb-6 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c85a9] mb-2.5 font-display">
                Corpus Access
              </p>
              <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] text-[#13233f] mb-2.5 font-display">
                Login to continue
              </h2>
              <p className="text-[15px] leading-[1.75] text-[#5a6b87] m-0">
                Use your Corpus phone number and password to open the internship
                activity workspace.
              </p>
            </div>

            <form className="grid gap-[18px]" onSubmit={handleSubmit}>
              <label
                className="grid gap-2 text-[#243752]"
                htmlFor="corpus-login-phone"
              >
                <span className="text-xs font-semibold tracking-[0.03em]">
                  Phone Number
                </span>
                <input
                  id="corpus-login-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    const cleaned = event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10);
                    setPhone(cleaned);
                  }}
                  className="w-full min-h-[56px] px-4 rounded-2xl bg-[#f7faff]/95 border border-[#bed0e9]/95 text-[#13233f] text-[15px] placeholder-[#8b9bb4] focus:bg-white focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/16 focus:outline-none transition-all duration-200"
                  placeholder="Enter 10-digit number"
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                  required
                />
              </label>

              <label
                className="grid gap-2 text-[#243752]"
                htmlFor="corpus-login-password"
              >
                <span className="text-xs font-semibold tracking-[0.03em]">
                  Password
                </span>
                <div className="relative w-full">
                  <input
                    id="corpus-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full min-h-[56px] pl-4 pr-12 rounded-2xl bg-[#f7faff]/95 border border-[#bed0e9]/95 text-[#13233f] text-[15px] placeholder-[#8b9bb4] focus:bg-white focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/16 focus:outline-none transition-all duration-200"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-none border-none text-[#8b9bb4] hover:text-[#3b82f6] flex items-center justify-center p-1 cursor-pointer"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </label>

              {statusMessage && (
                <div className="flex items-center gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-[14px] p-[12px_14px] text-[#1d4ed8] text-[13px] font-semibold shadow-[0_0_10px_rgba(59,130,246,0.08)] animate-pulse-border">
                  <span className="text-[#3b82f6] text-base inline-block leading-none animate-spin">
                    ◌
                  </span>
                  <span className="font-body">{statusMessage}</span>
                </div>
              )}

              {error ? (
                <p className="bg-[#fff1f3] border border-[#f4c1c8] rounded-[14px] text-[#8f2532] text-xs leading-[1.6] m-0 p-[12px_14px]">
                  {error}
                </p>
              ) : (
                <p className="text-[#6b7f9d] text-[13px] leading-[1.6] m-0">
                  Corpus is the only required login to enter the product.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[58px] rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] border-none text-white text-[15px] font-bold font-display tracking-[0.01em] px-[18px] shadow-[0_16px_34px_rgba(37,99,235,0.24)] hover:enabled:shadow-[0_20px_38px_rgba(37,99,235,0.3)] hover:enabled:-translate-y-[1px] disabled:opacity-[0.68] disabled:cursor-wait transition-all duration-[180ms]"
              >
                {loading ? 'Signing in…' : 'Login with Corpus'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
