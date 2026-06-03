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
      refetchMe();
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
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.14),transparent_30%),linear-gradient(135deg,#eef2ff_0%,#e0e7ff_45%,#dbeafe_100%)] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center">
          <div className="grid w-full gap-6 lg:grid-cols-2">
            <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#0b1020_0%,#12264c_55%,#13203a_100%)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300/80">
                Internship Activity Tracker
              </p>
              <h1 className="mt-6 max-w-[11ch] text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-[4.6rem]">
                One portal for batch selection.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Select your batch to unlock the teams, activities, and access
                assigned to you.
              </p>
            </section>

            <section className="rounded-[28px] bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Corpus Access
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                Loading batches...
              </h2>
            </section>
          </div>
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
                One portal for batch access and activity control.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Pick the batch you belong to and continue into your workspace.
                Your batch decides which teams and activities you can access.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-slate-200">
                    01
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Batch Selection
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Choose the correct batch to unlock the right access and keep
                    your profile aligned.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-slate-200">
                    02
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Team Access
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Once confirmed, your dashboard will reflect the teams,
                    activities, and records tied to that batch.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white/90 p-7 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Batch Access
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
              Select your batch to continue
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              This is a one-time selection. If you are unsure, confirm with your
              mentor before proceeding.
            </p>

            <div className="my-6 h-px w-full bg-slate-200" />

            {loadError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {loadError}
              </div>
            )}

            {batches.length === 0 ? (
              <p className="text-sm text-slate-500">
                No batches are available yet. Ask an admin to create one.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit();
                }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  {batches.map((b) => {
                    const active = selectedId === b.id;

                    return (
                      <label
                        key={b.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 transition-all duration-200 ${
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="batch"
                          value={b.id}
                          checked={active}
                          onChange={() => setSelectedId(b.id)}
                          className="h-4 w-4 accent-blue-600"
                        />

                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-base font-semibold text-slate-900">
                            {b.name}
                          </strong>
                          {b.date && (
                            <span className="mt-1 block text-sm text-slate-500">
                              {b.date}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={selectedId === null || loading}
                  className="w-full rounded-2xl bg-[linear-gradient(90deg,#2563eb_0%,#0ea5e9_100%)] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-transform duration-200 hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Setting batch…' : 'Confirm Selection'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
