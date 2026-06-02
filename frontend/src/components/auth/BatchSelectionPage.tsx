import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBatches } from '../../services/api/batches';
import { setMyBatch } from '../../services/api/profile';
import { useAuth } from '../../contexts/AuthContext';

export function BatchSelectionPage() {
  const { refetchMe } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  async function handleSubmit() {
    if (selectedId === null) return;
    setLoading(true);
    setError(null);

    try {
      await setMyBatch(selectedId);
      refetchMe();
      setLoading(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to set batch'
      );
      setLoading(false);
    }
  }

  if (batchesQuery.isLoading) {
    return (
      <main className="portal-login-page">
        <div className="portal-login-backdrop" aria-hidden="true" />
        <div className="portal-login-shell">
          <section className="portal-login-hero">
            <p className="portal-login-eyebrow">Loading batches…</p>
          </section>
        </div>
      </main>
    );
  }

  const batches = batchesQuery.data ?? [];
  const loadError =
    error ??
    (batchesQuery.isError
      ? batchesQuery.error instanceof Error
        ? batchesQuery.error.message
        : 'Failed to load batches'
      : null);

  return (
    <main className="portal-login-page">
      <div className="portal-login-backdrop" aria-hidden="true" />
      <div className="portal-login-shell">
        <section className="portal-login-hero">
          <p className="portal-login-eyebrow">Welcome — Choose Your Batch</p>
          <h1 className="portal-login-title">
            Select the batch you belong to.
          </h1>
          <p className="portal-login-copy">
            This is a one-time selection. Your batch determines which teams and
            activities you can access. If you&rsquo;re unsure, ask your mentor.
          </p>

          {loadError && (
            <div
              style={{
                color: 'var(--color-error, #e53e3e)',
                marginBottom: '1rem',
              }}
            >
              {loadError}
            </div>
          )}

          {batches.length === 0 ? (
            <p
              className="portal-login-copy"
              style={{ color: 'var(--color-muted)' }}
            >
              No batches are available yet. Ask an admin to create one.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                {batches.map((b) => (
                  <label
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      border:
                        selectedId === b.id
                          ? '2px solid var(--color-accent, #3182ce)'
                          : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background:
                        selectedId === b.id
                          ? 'var(--color-accent-subtle, #ebf4ff)'
                          : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="batch"
                      value={b.id}
                      checked={selectedId === b.id}
                      onChange={() => setSelectedId(b.id)}
                      style={{ accentColor: 'var(--color-accent, #3182ce)' }}
                    />
                    <span>
                      <strong>{b.name}</strong>
                      {b.date && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {b.date}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={selectedId === null || loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  cursor:
                    selectedId === null || loading ? 'not-allowed' : 'pointer',
                  opacity: selectedId === null || loading ? 0.6 : 1,
                  background: 'var(--color-accent, #3182ce)',
                  color: '#fff',
                }}
              >
                {loading ? 'Setting batch…' : 'Confirm Selection'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
