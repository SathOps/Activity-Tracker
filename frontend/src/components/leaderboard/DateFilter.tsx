interface Props {
  since: string;
  until: string;
  onSince: (v: string) => void;
  onUntil: (v: string) => void;
  onClear: () => void;
}

export function DateFilter({ since, until, onSince, onUntil, onClear }: Props) {
  const hasFilter = since || until;
  const invalid = since && until && since > until;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">
        📅 Date Range Filter
      </h4>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label
            className="block text-xs text-slate-500 mb-1"
            htmlFor="leaderboard-since"
          >
            From
          </label>
          <input
            id="leaderboard-since"
            type="date"
            value={since}
            onChange={(e) => onSince(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div>
          <label
            className="block text-xs text-slate-500 mb-1"
            htmlFor="leaderboard-until"
          >
            To
          </label>
          <input
            id="leaderboard-until"
            type="date"
            value={until}
            onChange={(e) => onUntil(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        {hasFilter && (
          <button
            onClick={onClear}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            ✖ Clear
          </button>
        )}
      </div>
      {invalid && (
        <p className="mt-2 text-xs text-amber-600">
          ⚠️ From date must be before To date.
        </p>
      )}
      {hasFilter && !invalid && (
        <p className="mt-2 text-xs text-blue-600">
          🗓 Filtering {since} → {until} (UTC)
        </p>
      )}
      {!hasFilter && (
        <p className="mt-2 text-xs text-slate-400">
          No date filter — showing full history.
        </p>
      )}
    </div>
  );
}
