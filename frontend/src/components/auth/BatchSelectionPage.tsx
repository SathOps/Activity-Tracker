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
  const [showAbout, setShowAbout] = useState(false);

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

  const batches = batchesQuery.data ?? [];
  const loadError =
    error ??
    (batchesQuery.isError
      ? batchesQuery.error instanceof Error
        ? batchesQuery.error.message
        : 'Failed to load batches'
      : null);

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden p-0 font-body bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_60%_10%,rgba(14,165,233,0.1),transparent_30%),linear-gradient(135deg,#eef0fa_0%,#e8ecf5_40%,#eff0fa_100%)] bg-[size:200%_200%] animate-[login-gradient-shift_15s_ease_infinite]">
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_40%),linear-gradient(315deg,rgba(37,99,235,0.08),transparent_38%)]"
        aria-hidden="true"
      />
      <div className="relative w-screen h-screen overflow-hidden z-10 max-[800px]:flex max-[800px]:flex-col max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:w-full max-[800px]:overflow-visible">
        {/* Left Section (Hero) - Hidden on Mobile */}
        <section className="absolute left-0 top-0 w-[65vw] h-full z-20 flex flex-col justify-center gap-12 p-[60px_48px] text-[#f8fbff] [clip-path:polygon(0_0,100%_0,80%_100%,0_100%)] bg-[linear-gradient(145deg,rgba(11,18,32,0.98),rgba(17,45,92,0.96)),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-[1024px]:min-[801px]:w-[65vw] max-[1024px]:min-[801px]:p-[50px_36px] max-[800px]:hidden">
          <div
            className="absolute -right-20 -top-[60px] w-80 h-80 pointer-events-none bg-[radial-gradient(circle,rgba(96,165,250,0.22),transparent_60%)]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <p className="text-[#b7ccf6] font-display text-xs font-bold tracking-[0.18em] uppercase m-0 mb-2 max-w-[600px]">
              Internship Activity Tracker
            </p>
            <h1 className="text-white font-display text-[clamp(2.2rem,3.2vw,3.8rem)] font-bold tracking-[-0.04em] leading-[1.05] m-0 mb-3 max-w-[18ch] max-[1024px]:min-[801px]:text-[clamp(1.8rem,2.5vw,2.6rem)] max-[800px]:text-[2.2rem] max-[800px]:max-w-full">
              One portal for batch access and activity control.
            </h1>
            <p className="text-[rgba(228,238,255,0.9)] text-[15px] leading-relaxed m-0 mb-4 mr-auto max-w-[500px] relative z-10">
              Pick the batch you belong to and continue into your workspace.
              Your batch decides which teams and activities you can access.
            </p>

            <div className="grid grid-cols-2 gap-5 mt-3 mr-auto max-w-[640px] relative z-10 max-[1024px]:min-[801px]:gap-3 max-[1024px]:min-[801px]:pt-5 max-[800px]:grid-cols-1 max-[800px]:gap-3 max-[800px]:pt-8 max-[800px]:max-w-full">
              <article className="group relative flex flex-col p-[22px] rounded-2xl cursor-pointer backdrop-blur-md bg-[linear-gradient(135deg,rgba(15,23,42,0.4)_0%,rgba(30,41,59,0.2)_100%)] border border-[rgba(147,197,253,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-400 hover:translate-y-[-8px] hover:scale-[1.03] hover:border-[rgba(96,165,250,0.4)] hover:bg-[linear-gradient(135deg,rgba(20,30,55,0.6)_0%,rgba(37,99,235,0.1)_100%)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden [animation:card-entrance_0.8s_cubic-bezier(0.16,1,0.3,1)_both,card-idle-float_6s_infinite_ease-in-out_alternate] max-[1024px]:min-[801px]:p-3.5 max-[800px]:p-5 max-[800px]:rounded-xl">
                <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -skew-x-[20deg] transition-none group-hover:left-[150%] group-hover:duration-800 group-hover:ease-in-out" />
                <span className="inline-flex w-fit px-3 py-1.5 mb-3.5 font-display text-[11px] font-bold tracking-widest text-[#93c5fd] bg-[rgba(96,165,250,0.1)] border border-[rgba(147,197,253,0.15)] rounded-full transition-all duration-300 group-hover:bg-[rgba(96,165,250,0.25)] group-hover:border-[rgba(147,197,253,0.4)] group-hover:text-white group-hover:shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                  01
                </span>
                <h2 className="text-white font-display text-lg font-semibold m-0 mb-2 transition-all duration-300 group-hover:text-[#60a5fa]">
                  Batch Selection
                </h2>
                <p className="text-[#94a3b8] text-[13.5px] leading-relaxed m-0 transition-all duration-300 group-hover:text-[#e2e8f0]">
                  Choose the correct batch to unlock the right access and keep
                  your profile aligned.
                </p>
              </article>

              <article className="group relative flex flex-col p-[22px] rounded-2xl cursor-pointer backdrop-blur-md bg-[linear-gradient(135deg,rgba(15,23,42,0.4)_0%,rgba(30,41,59,0.2)_100%)] border border-[rgba(147,197,253,0.1)] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-400 hover:translate-y-[-8px] hover:scale-[1.03] hover:border-[rgba(96,165,250,0.4)] hover:bg-[linear-gradient(135deg,rgba(20,30,55,0.6)_0%,rgba(37,99,235,0.1)_100%)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_25px_rgba(37,99,235,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden [animation:card-entrance_0.8s_cubic-bezier(0.16,1,0.3,1)_both,card-idle-float_6s_infinite_ease-in-out_alternate] max-[1024px]:min-[801px]:p-3.5 max-[800px]:p-5 max-[800px]:rounded-xl">
                <div className="absolute top-0 -left-[150%] w-1/2 h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] -skew-x-[20deg] transition-none group-hover:left-[150%] group-hover:duration-800 group-hover:ease-in-out" />
                <span className="inline-flex w-fit px-3 py-1.5 mb-3.5 font-display text-[11px] font-bold tracking-widest text-[#93c5fd] bg-[rgba(96,165,250,0.1)] border border-[rgba(147,197,253,0.15)] rounded-full transition-all duration-300 group-hover:bg-[rgba(96,165,250,0.25)] group-hover:border-[rgba(147,197,253,0.4)] group-hover:text-white group-hover:shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                  02
                </span>
                <h2 className="text-white font-display text-lg font-semibold m-0 mb-2 transition-all duration-300 group-hover:text-[#60a5fa]">
                  Team Access
                </h2>
                <p className="text-[#94a3b8] text-[13.5px] leading-relaxed m-0 transition-all duration-300 group-hover:text-[#e2e8f0]">
                  Once confirmed, your dashboard will reflect the teams,
                  activities, and records tied to that batch.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Right Section (Form) */}
        <section className="absolute right-0 top-0 w-screen h-full z-10 flex flex-col items-center justify-center pl-[68vw] pr-[4vw] py-0 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%,#f1f5f9_100%)] overflow-hidden max-[1024px]:min-[801px]:pl-[68vw] max-[1024px]:min-[801px]:pr-[4vw] max-[800px]:relative max-[800px]:w-full max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:flex max-[800px]:items-center max-[800px]:justify-center max-[800px]:p-6 max-[800px]:bg-[linear-gradient(to_bottom,#eff2f9_0%,#f8fafc_15%,#f8fafc_100%)] max-[800px]:overflow-y-auto">
          <div className="w-full max-w-[380px] flex flex-col gap-0 animate-[panel-fade-in_0.6s_cubic-bezier(0.16,1,0.3,1)_both] max-[800px]:max-w-[440px] max-[800px]:py-8 max-[800px]:mx-auto">
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

            <div
              className="w-12 h-1 rounded-sm mb-5 bg-[linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc)] bg-[size:200%_100%] animate-[accent-shimmer_3s_ease-in-out_infinite] max-[800px]:mx-auto max-[800px]:mb-6"
              aria-hidden="true"
            />

            <div className="mb-7 max-[800px]:mb-5 max-[800px]:text-center">
              <h2 className="text-[#0f172a] font-display text-[26px] font-bold tracking-[-0.03em] leading-tight m-0 mb-2">
                Batch Access
              </h2>
              <p className="text-[#64748b] text-[14.5px] leading-relaxed m-0 max-[800px]:text-sm">
                {batchesQuery.isLoading
                  ? 'Loading available batches...'
                  : 'Select your batch to continue into your workspace.'}
              </p>
            </div>

            {batchesQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <span className="w-10 h-10 border-4 border-indigo-600/30 rounded-full border-t-indigo-600 animate-spin" />
                <span className="text-sm font-semibold text-slate-500 animate-pulse">
                  Loading batches...
                </span>
              </div>
            ) : (
              <>
                {loadError && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-600">
                    {loadError}
                  </div>
                )}

                {batches.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center">
                    No batches are available yet. Ask an admin to create one.
                  </p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSubmit();
                    }}
                    className="grid gap-5 w-full"
                  >
                    <div className="grid gap-3">
                      {batches.map((b) => {
                        const active = selectedId === b.id;

                        return (
                          <label
                            key={b.id}
                            className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                              active
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-[0_0_0_1px_rgba(79,70,229,0.12)]'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="batch"
                              value={b.id}
                              checked={active}
                              onChange={() => setSelectedId(b.id)}
                              className="appearance-none w-4 h-4 border-[1.5px] border-[#cbd5e1] rounded-full outline-none bg-white cursor-pointer grid place-content-center relative transition-all duration-200 hover:border-indigo-600 checked:bg-indigo-600 checked:border-indigo-600 after:content-[''] after:w-2 after:h-2 after:rounded-full after:scale-0 checked:after:scale-100 after:transition-transform after:duration-120 after:bg-white"
                            />

                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-sm font-semibold text-slate-900">
                                {b.name}
                              </strong>
                              {b.date && (
                                <span className="mt-0.5 block text-xs text-slate-500">
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
                      className="group/btn relative flex items-center justify-center gap-2 w-full min-h-[48px] px-5 mt-1 rounded-xl text-white font-display text-sm font-bold tracking-[0.01em] bg-[linear-gradient(135deg,#0b1530_0%,#1e3b8a_50%,#2563eb_100%)] shadow-[0_4px_14px_rgba(30,58,138,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:enabled:shadow-[0_8px_24px_rgba(30,58,138,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:enabled:-translate-y-[1.5px] active:enabled:translate-y-0 disabled:opacity-65 disabled:cursor-not-allowed overflow-hidden cursor-pointer border-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 rounded-full border-t-white animate-spin" />
                          {'Setting batch…'}
                        </span>
                      ) : (
                        <>
                          <span>Confirm Selection</span>
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
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="mt-6">
              <div className="h-[1px] bg-[linear-gradient(90deg,transparent,#e2e8f0,transparent)] mb-4" />
              <p className="text-[#94a3b8] text-xs leading-relaxed m-0 mb-3 text-center">
                This is a one-time selection. If you are unsure, confirm with
                your mentor.
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
                        Batch Selection
                      </h4>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Choose the correct batch to unlock the right access and
                      keep your profile aligned.
                    </p>
                  </article>

                  <article className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50/80">
                        02
                      </span>
                      <h4 className="text-slate-900 font-display font-bold text-sm">
                        Team Access
                      </h4>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Once confirmed, your dashboard will reflect the teams,
                      activities, and records tied to that batch.
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
