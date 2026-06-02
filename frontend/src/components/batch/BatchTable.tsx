import { Download } from 'lucide-react';
import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { downloadCsv } from '../../services/api/upload';
import { toDisplayText } from '../../lib/utils';
import type { BatchUserRow } from '../../types';

function Num({ v }: { v: number | undefined | null }) {
  if (v == null) return <span className="text-slate-300">—</span>;
  return <span>{v}</span>;
}

const COLUMNS = [
  {
    key: 'username',
    header: 'Username',
    sortable: true,
    render: (v: unknown) => (
      <span className="font-mono font-semibold text-slate-800 text-xs">
        @{String(v)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (v: unknown) => (
      <Badge variant={v === 'Success' ? 'success' : 'error'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'commits_total',
    header: 'Commits',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'commits_morning',
    header: 'Morning',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'commits_afternoon',
    header: 'Afternoon',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'projects_authored',
    header: 'Proj (Auth)',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'projects_contributed',
    header: 'Proj (Contr)',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'groups_count',
    header: 'Groups',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_total',
    header: 'MR Total',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_no_desc',
    header: 'No Desc',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_no_issues',
    header: 'No Issues',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_no_time',
    header: 'No Time',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_failed_pipe',
    header: 'Failed Pipe',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_no_semantic',
    header: 'No Semantic',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_no_review',
    header: 'No Review',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_gt_2_days',
    header: '>2 Days',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'mr_gt_1_week',
    header: '>1 Week',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_total',
    header: 'Issues',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_closed',
    header: 'Closed',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_no_desc',
    header: 'No Desc',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_no_labels',
    header: 'No Labels',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_no_milestone',
    header: 'No Mile.',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_no_time',
    header: 'No Time',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_long_open',
    header: 'Long Open',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'issue_no_semantic',
    header: 'No Semant.',
    sortable: true,
    render: (v: unknown) => <Num v={v as number} />,
  },
  {
    key: 'error',
    header: 'Error',
    render: (v: unknown) =>
      v ? (
        <span className="text-xs text-red-500 truncate max-w-[160px] block">
          {toDisplayText(v)}
        </span>
      ) : null,
  },
];

interface Props {
  rows: BatchUserRow[];
}

export function BatchTable({ rows }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Unified Batch Report
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {rows.length} user{rows.length !== 1 ? 's' : ''} processed
          </p>
        </div>
        <button
          onClick={() => downloadCsv(rows as never, 'batch_report.csv')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>
      <DataTable
        columns={COLUMNS as never}
        data={rows as never}
        keyFn={(r) => String(r['username'])}
        searchable
        compact
        pageSize={25}
      />
    </div>
  );
}
