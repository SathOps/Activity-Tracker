import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBatches } from '../../services/api/batches';
import { setMyBatch } from '../../services/api/profile';
import { useAuth } from '../../contexts/AuthContext';

type Batch = {
  id: number;
  name: string;
  date?: string | null;
};

export function BatchSelectionPage() {
  const { refetchMe } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batchesQuery = useQuery<Batch[]>({
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
      await refetchMe();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to set batch'
      );
    } finally {
      setLoading(false);
    }
  }

  if (batchesQuery.isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 font-[var(--font-body)] bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_60%_10%,rgba(14,165,233,0.1),transparent_30%),linear-gradient(135deg,#eef0fa_0%,#e8ecf5_40%,#eff0fa_100%)] bg-[length:200%_200%] animate-[login-gradient-shift_15s_ease_infinite]">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_40%),linear-gradient(315deg,rgba(37,99,235,0.08),transparent_38%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-5xl">
          <section className="relative overflow-hidden rounded-[32px] border border-slate-200/60 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-10 shadow-[0_28px_70px_rgba(15,23,42,0.22)] text-white md:p-11">
            <p className="relative z-10 font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              Loading batches…
            </p>
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 font-[var(--font-body)] bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_60%_10%,rgba(14,165,233,0.1),transparent_30%),linear-gradient(135deg,#eef0fa_0%,#e8ecf5_40%,#eff0fa_100%)] bg-[length:200%_200%] animate-[login-gradient-shift_15s_ease_infinite]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_40%),linear-gradient(315deg,rgba(37,99,235,0.08),transparent_38%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 grid w-full max-w-[1240px] gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.9fr)]">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200/20 bg-[linear-gradient(145deg,rgba(11,18,32,0.97),rgba(17,45,92,0.94)),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)] p-8 text-slate-50 shadow-[0_28px_70px_rgba(15,23,42,0.22)] md:p-11">
          <div className="pointer-events-none absolute -right-20 -top-14 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.22),transparent_60%)]" />
          <div className="relative z-10">
            <p className="mb-4 font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              Welcome — Choose Your Batch
            </p>

            <h1 className="mb-5 max-w-[11ch] font-[var(--font-display)] text-4xl font-bold leading-[0.98] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4.6rem]">
              Select the batch you belong to.
            </h1>

            <p className="mb-8 max-w-[58ch] text-[17px] leading-8 text-slate-200/90">
              This is a one-time selection. Your batch determines which teams
              and activities you can access. If you&apos;re unsure, ask your
              mentor.
            </p>

            {loadError && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            {batches.length === 0 ? (
              <p className="text-sm text-slate-300">
                No batches are available yet. Ask an admin to create one.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit();
                }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  {batches.map((b) => (
                    <label
                      key={b.id}
                      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition-all duration-200 ${
                        selectedId === b.id
                          ? 'border-blue-400 bg-blue-50/10 shadow-[0_0_0_1px_rgba(96,165,250,0.18)]'
                          : 'border-slate-200/15 bg-white/0 hover:border-slate-200/30 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="batch"
                        value={b.id}
                        checked={selectedId === b.id}
                        onChange={() => setSelectedId(b.id)}
                        className="peer h-4 w-4 accent-blue-500"
                      />

                      <span className="flex-1 text-sm text-slate-100">
                        <strong className="block text-base font-semibold text-white">
                          {b.name}
                        </strong>
                        {b.date && (
                          <span className="mt-1 block text-sm text-slate-300">
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
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-950/25 transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Setting batch…' : 'Confirm Selection'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
