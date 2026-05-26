import { useState } from 'react';
import { MetricCard } from '../ui/MetricCard';
import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { scoreBg, toDisplayText } from '../../lib/utils';
import type { MRStats, MREntry } from '../../types';

const STATE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> =
  {
    merged: 'success',
    opened: 'info',
    closed: 'error',
  };

const COLUMNS = [
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    render: (v: unknown, r: MREntry) => (
      <a
        href={r.web_url ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1"
      >
        <span className="truncate max-w-[200px]">{String(v)}</span>
        <ExternalLink size={11} className="flex-shrink-0" />
      </a>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    render: (v: unknown) => (
      <Badge variant={v === 'Authored' ? 'purple' : 'info'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'state',
    header: 'State',
    sortable: true,
    render: (v: unknown) => (
      <Badge variant={STATE_VARIANT[String(v)] ?? 'default'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    render: (v: unknown) => (
      <span className="text-xs">{String(v).split('T')[0]}</span>
    ),
  },
  {
    key: 'desc_score',
    header: 'Desc Score',
    sortable: true,
    render: (v: unknown) =>
      v != null ? (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(Number(v))}`}
        >
          {toDisplayText(v)}
        </span>
      ) : (
        '—'
      ),
  },
];

interface Props {
  stats: MRStats;
  mrs: MREntry[];
}

export function MRsPanel({ stats, mrs }: Props) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        🔀 Merge Requests
      </h3>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard label="Total MRs" value={stats.total} />
        <MetricCard label="Merged" value={stats.merged} />
        <MetricCard label="Open" value={stats.opened} />
        <MetricCard label="Closed" value={stats.closed} />
      </div>

      {mrs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            <span>MR Details ({mrs.length})</span>
            {showTable ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showTable && (
            <div className="px-4 pb-4">
              <DataTable
                columns={COLUMNS as never}
                data={mrs as never}
                keyFn={(r) => `${String(r['project_id'])}-${String(r['iid'])}`}
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
