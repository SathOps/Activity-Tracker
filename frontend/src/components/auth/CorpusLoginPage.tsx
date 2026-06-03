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

          <section className="portal-login-panel">
            <div className="portal-login-panel-header">
              <p className="portal-login-panel-kicker">Corpus Access</p>
              <h2 className="portal-login-panel-title">Login to continue</h2>
              <p className="portal-login-panel-copy">
                Use your Corpus phone number and password to open the internship
                activity workspace.
              </p>
            </div>

            <form className="portal-login-form" onSubmit={handleSubmit}>
              <label
                className="portal-login-field"
                htmlFor="corpus-login-phone"
              >
                <span className="portal-login-label">Phone Number</span>
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
                  className="portal-login-input"
                  placeholder="Enter 10-digit number"
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                  required
                />
              </label>

              <label
                className="portal-login-field"
                htmlFor="corpus-login-password"
              >
                <span className="portal-login-label">Password</span>
                <div className="portal-password-input-wrapper">
                  <input
                    id="corpus-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="portal-login-input portal-password-input"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="portal-password-toggle-btn"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </label>

              {statusMessage && (
                <div className="portal-login-status-bar">
                  <span className="portal-login-status-spinner animate-spin">
                    ◌
                  </span>
                  <span className="portal-login-status-text">
                    {statusMessage}
                  </span>
                </div>
              )}

              {error ? (
                <p className="portal-login-error">{error}</p>
              ) : (
                <p className="portal-login-hint">
                  Corpus is the only required login to enter the product.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="portal-login-submit"
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
