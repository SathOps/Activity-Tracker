import { downloadCsv } from '../../services/api/upload';
import { Download } from 'lucide-react';
import { rankMedal, scoreBg } from '../../lib/utils';
import type { TeamResult, MemberRow } from '../../types';

interface Props {
  teams: TeamResult[];
}

export function RankingTable({ teams }: Props) {
  // Build per-team ranking rows
  const teamRows = [...teams].sort(
    (a, b) => b.totals.team_score - a.totals.team_score
  );

  // Build individual ranking (all members across all teams, sorted by score)
  const allMembers: (MemberRow & { team_name: string })[] = teams
    .flatMap((t) => t.members.map((m) => ({ ...m, team_name: t.team_name })))
    .sort((a, b) => b.score - a.score);

  function exportAll() {
    downloadCsv(
      teamRows.map((t, i) => ({
        rank: i + 1,
        team: t.team_name,
        project: t.project_name,
        team_score: t.totals.team_score,
        commits: t.totals.total_commits,
        mr_merged: t.totals.mr_merged,
        issues_closed: t.totals.issues_closed,
      })),
      'leaderboard_teams.csv'
    );
  }

  return (
    <div className="space-y-6">
      {/* Team ranking */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            🏆 Team Rankings
          </h3>
          <button
            onClick={exportAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Rank',
                'Team',
                'Project',
                'Score',
                'Commits',
                'MR Merged',
                'Issues Closed',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {teamRows.map((t, i) => (
              <tr
                key={t.team_name}
                className={
                  i === 0 ? 'bg-amber-50' : i === 1 ? 'bg-slate-50' : ''
                }
              >
                <td className="px-4 py-3 text-lg font-bold text-slate-700 w-16">
                  {rankMedal(i + 1)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 text-sm">
                    {t.team_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.members.length} member{t.members.length !== 1 ? 's' : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {t.project_name || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-black px-2.5 py-1 rounded-full ${scoreBg(t.totals.team_score > 0 ? 80 : 0)}`}
                  >
                    {t.totals.team_score}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {t.totals.total_commits}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {t.totals.mr_merged}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {t.totals.issues_closed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Individual ranking */}
      {allMembers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">
              🧑‍💻 Individual Rankings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Score = Commits×1 + Merged MRs×5 + Total MRs×2 + Issues Closed×3
            </p>
          </div>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Rank',
                  'Member',
                  'Team',
                  'Score',
                  'Commits',
                  'MR Merged',
                  'Issues Closed',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {allMembers.slice(0, 50).map((m, i) => (
                <tr
                  key={`${m.team_name}-${m.username}`}
                  className={i < 3 ? 'bg-amber-50' : ''}
                >
                  <td className="px-4 py-2.5 text-base font-bold text-slate-600">
                    {rankMedal(i + 1)}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-xs text-slate-800">
                    @{m.username}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {m.team_name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(m.score)}`}
                    >
                      {m.score}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {m.total_commits}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {m.mr_merged}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {m.issues_closed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
