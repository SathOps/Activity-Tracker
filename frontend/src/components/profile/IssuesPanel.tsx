import { useState } from 'react';
import { MetricCard } from '../ui/MetricCard';
import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { IssueStats, IssueEntry } from '../../types';

const COLUMNS = [
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    render: (v: unknown, r: IssueEntry) => (
      <a
        href={r.web_url ?? '#'}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1"
      >
        <span className="truncate max-w-[220px]">{String(v)}</span>
        <ExternalLink size={11} className="flex-shrink-0" />
      </a>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    render: (v: unknown) => (
      <Badge variant={v === 'Author' ? 'purple' : 'info'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'state',
    header: 'State',
    sortable: true,
    render: (v: unknown) => (
      <Badge variant={v === 'opened' ? 'warning' : 'success'}>
        {String(v)}
      </Badge>
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
    key: 'labels',
    header: 'Labels',
    render: (v: unknown) => {
      const labels = Array.isArray(v) ? (v as string[]) : [];
      return labels.length ? (
        <div className="flex flex-wrap gap-1">
          {labels.slice(0, 3).map((l) => (
            <Badge key={l} className="text-[10px]">
              {l}
            </Badge>
          ))}
          {labels.length > 3 && <Badge>+{labels.length - 3}</Badge>}
        </div>
      ) : (
        <span className="text-xs text-slate-400">—</span>
      );
    },
  },
];

interface Props {
  stats: IssueStats;
  issues: IssueEntry[];
}

export function IssuesPanel({ stats, issues }: Props) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-700">⚠️ Issues</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard label="Total Issues" value={stats.total} />
        <MetricCard label="Open" value={stats.opened ?? 0} />
        <MetricCard label="Closed" value={stats.closed} />
      </div>

      {issues.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            <span>Issue Details ({issues.length})</span>
            {showTable ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showTable && (
            <div className="px-4 pb-4">
              <DataTable
                columns={COLUMNS as never}
                data={issues as never}
                keyFn={(r) =>
                  `${String(r['title'])}-${String(r['created_at'])}`
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
