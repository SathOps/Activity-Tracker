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
    <main className="portal-login-page">
      <div className="portal-login-backdrop" aria-hidden="true" />
      <div className="portal-login-shell">
        <section className="portal-login-hero">
          <p className="portal-login-eyebrow">Internship Activity Tracker</p>
          <h1 className="portal-login-title">
            One portal for standup operations and Git compliance review.
          </h1>
          <p className="portal-login-copy">
            Sign in with Corpus to enter a unified workspace. Standup Tracker
            handles daily submissions and verification, while Git Compliance
            Checker opens the GitLab-backed analytics and audit tools.
          </p>

          <div className="portal-feature-grid">
            <article className="portal-feature-card">
              <span className="portal-feature-badge">01</span>
              <h2 className="portal-feature-title">Standup Tracker</h2>
              <p className="portal-feature-copy">
                Track standup uploads, verify team completion, review audio
                evidence, and manage daily status from one operational surface.
              </p>
            </article>

            <article className="portal-feature-card">
              <span className="portal-feature-badge">02</span>
              <h2 className="portal-feature-title">Git Compliance Checker</h2>
              <p className="portal-feature-copy">
                Add GitLab access after login to inspect developer activity,
                weekly trends, team rankings, batch analytics, and roster data.
              </p>
            </article>
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
            <label className="portal-login-field" htmlFor="corpus-login-phone">
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
    </main>
  );
}
