import { useState } from 'react';
import { MetricCard } from '../ui/MetricCard';
import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { toDisplayText } from '../../lib/utils';
import type { CommitStats, CommitEntry } from '../../types';

const SLOT_VARIANT: Record<string, 'success' | 'info' | 'default'> = {
  Morning: 'success',
  Afternoon: 'info',
  Other: 'default',
};

const COLUMNS = [
  {
    key: 'project_name',
    header: 'Project',
    sortable: true,
    render: (v: unknown) => (
      <span className="text-xs font-medium text-slate-700 truncate max-w-[160px] block">
        {String(v)}
      </span>
    ),
  },
  {
    key: 'message',
    header: 'Commit',
    sortable: false,
    render: (v: unknown) => (
      <span className="text-xs text-slate-600 truncate max-w-[240px] block">
        {String(v)}
      </span>
    ),
  },
  { key: 'date', header: 'Date', sortable: true },
  { key: 'time', header: 'Time (IST)', sortable: true },
  {
    key: 'slot',
    header: 'Slot',
    sortable: true,
    render: (v: unknown) => (
      <Badge variant={SLOT_VARIANT[String(v)] ?? 'default'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'web_url',
    header: 'Link',
    render: (v: unknown) =>
      v ? (
        <a
          href={toDisplayText(v)}
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 hover:underline"
        >
          <ExternalLink size={13} />
        </a>
      ) : null,
  },
];

interface Props {
  stats: CommitStats;
  commits: CommitEntry[];
}

export function CommitsPanel({ stats, commits }: Props) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        💻 Commit Activity (IST)
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard label="Total Commits" value={stats.total} />
        <MetricCard
          label="Morning (9:00–12:29)"
          value={stats.morning_commits}
          sub={
            stats.morning_pct != null
              ? `${stats.morning_pct}% of total`
              : undefined
          }
        />
        <MetricCard
          label="Afternoon (12:30–17:00)"
          value={stats.afternoon_commits}
          sub={
            stats.afternoon_pct != null
              ? `${stats.afternoon_pct}% of total`
              : undefined
          }
        />
      </div>

      {commits.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            <span>Recent Commits ({commits.length})</span>
            {showTable ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showTable && (
            <div className="px-4 pb-4">
              <DataTable
                columns={COLUMNS as never}
                data={commits as never}
                keyFn={(r) =>
                  toDisplayText(
                    r['sha'] ??
                      `${toDisplayText(r['date'])}-${toDisplayText(r['message'])}`
                  )
                }
                searchable
                compact
                pageSize={15}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
