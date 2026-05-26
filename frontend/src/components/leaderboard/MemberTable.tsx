import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { scoreBg, toDisplayText } from '../../lib/utils';
import type { MemberRow, TeamTotals } from '../../types';

const COLUMNS = [
  {
    key: 'username',
    header: 'Member',
    sortable: true,
    render: (v: unknown) => (
      <span className="font-mono font-semibold text-xs text-slate-800">
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
    key: 'score',
    header: 'Score',
    sortable: true,
    render: (v: unknown) => (
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(Number(v))}`}
      >
        {String(v)}
      </span>
    ),
  },
  { key: 'total_commits', header: 'Commits', sortable: true },
  { key: 'morning_commits', header: 'Morning', sortable: true },
  { key: 'afternoon_commits', header: 'Afternoon', sortable: true },
  { key: 'mr_merged', header: 'MR Merged', sortable: true },
  { key: 'mr_created', header: 'MR Total', sortable: true },
  { key: 'mr_open', header: 'MR Open', sortable: true },
  { key: 'issues_closed', header: 'Issues Closed', sortable: true },
  { key: 'issues_raised', header: 'Issues Raised', sortable: true },
  { key: 'groups', header: 'Groups', sortable: true },
  {
    key: 'error',
    header: 'Error',
    render: (v: unknown) =>
      v ? (
        <span className="text-xs text-red-500">{toDisplayText(v)}</span>
      ) : null,
  },
];

interface Props {
  teamName: string;
  members: MemberRow[];
  totals: TeamTotals;
}

export function MemberTable({ teamName, members, totals }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{teamName}</h3>
        <div className="flex gap-4 text-xs text-slate-500">
          <span>
            Team Score:{' '}
            <strong className="text-slate-800">{totals.team_score}</strong>
          </span>
          <span>
            Commits: <strong>{totals.total_commits}</strong>
          </span>
          <span>
            MR Merged: <strong>{totals.mr_merged}</strong>
          </span>
          <span>
            Issues Closed: <strong>{totals.issues_closed}</strong>
          </span>
        </div>
      </div>
      <DataTable
        columns={COLUMNS as never}
        data={members as never}
        keyFn={(r) => String(r['username'])}
        compact
      />
    </div>
  );
}
