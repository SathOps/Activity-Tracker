/**
 * Team Leaderboard
 *
 * Teams are loaded from the DB roster (read-only here).
 * Use Roster Management to add/edit/delete teams and members.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Trophy, Briefcase, Database } from 'lucide-react';
import { getTeams, analyzeTeams } from '../../api';
import { useLeaderboardStore } from '../../stores/leaderboardStore';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { DateFilter } from './DateFilter';
import { MemberTable } from './MemberTable';
import { RankingTable } from './RankingTable';
import { cn } from '../../lib/utils';
import { useConfigStore } from '../../stores/configStore';
import type { Team, TeamResult } from '../../types';
import toast from 'react-hot-toast';

type Page = 'workspace' | 'ranking';

export function Leaderboard() {
  const [page, setPage] = useState<Page>('workspace');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [analysisResult, setAnalysisResult] = useState<TeamResult[] | null>(
    null
  );
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const { setTeams } = useLeaderboardStore();
  const setActiveMode = useConfigStore((s) => s.setActiveMode);

  // Load teams from DB roster
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const teams: Team[] = teamsQuery.data ?? [];

  // Sync to store
  useEffect(() => {
    if (teamsQuery.data) setTeams(teamsQuery.data);
  }, [teamsQuery.data, setTeams]);

  // Determine which teams to run analysis on
  const teamsToRun =
    selectedTeams.size > 0
      ? teams.filter((t) => selectedTeams.has(t.team_name))
      : teams;

  // Run analysis mutation
  const analyseMutation = useMutation({
    mutationFn: () => {
      const sinceISO = since ? new Date(since).toISOString() : undefined;
      const untilISO = until
        ? new Date(until + 'T23:59:59').toISOString()
        : undefined;
      return analyzeTeams(teamsToRun, sinceISO, untilISO);
    },
    onSuccess: (results) => {
      setAnalysisResult(results);
      setPage('ranking');
      toast.success('Analysis complete!');
    },
    onError: (e: Error) => toast.error(`Analysis failed: ${e.message}`),
  });

  function toggleTeam(teamName: string) {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamName)) {
        next.delete(teamName);
      } else {
        next.add(teamName);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          🏆 Team Leaderboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Run analytics to compare team productivity scores.{' '}
          <span className="font-medium text-slate-600">
            Score = Commits×1 + Merged MRs×5 + Total MRs×2 + Issues Closed×3
          </span>
        </p>
      </div>

      {/* Page toggle */}
      <div className="mb-6 flex gap-2">
        {(
          [
            ['workspace', 'Workspace', 'briefcase'],
            ['ranking', 'Leaderboard Ranking', 'trophy'],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              page === id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {icon === 'briefcase' ? (
              <Briefcase size={14} />
            ) : (
              <Trophy size={14} />
            )}{' '}
            {label}
          </button>
        ))}
      </div>

      {/* ── Workspace ──────────────────────────────────────────────────────── */}
      {page === 'workspace' && (
        <div className="space-y-5">
          {teamsQuery.isLoading && (
            <Spinner label="Loading teams from roster…" />
          )}
          {teamsQuery.isError && (
            <Alert variant="error">{(teamsQuery.error as Error).message}</Alert>
          )}

          {/* Roster notice */}
          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
            <Database size={13} />
            <span>
              Teams are managed in{' '}
              <button
                className="font-semibold underline"
                onClick={() => setActiveMode('roster')}
              >
                Roster Management
              </button>
              . Select teams below, then run analysis.
            </span>
          </div>

          {/* Teams checklist */}
          {teams.length === 0 && !teamsQuery.isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Database size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-500">
                No teams found in the roster.
              </p>
              <button
                className="mt-2 text-sm text-brand-600 hover:underline"
                onClick={() => setActiveMode('roster')}
              >
                Go to Roster Management to add teams →
              </button>
            </div>
          )}

          {teams.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Teams ({teams.length})
                </span>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() =>
                    setSelectedTeams(
                      selectedTeams.size === teams.length
                        ? new Set()
                        : new Set(teams.map((t) => t.team_name))
                    )
                  }
                >
                  {selectedTeams.size === teams.length
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              </div>
              {teams.map((team) => (
                <label
                  key={team.team_name}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.has(team.team_name)}
                    onChange={() => toggleTeam(team.team_name)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {team.team_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {team.members.length} member(s)
                    </p>
                  </div>
                  <Badge variant="default">{team.members.length}</Badge>
                </label>
              ))}
            </div>
          )}

          {/* Date filter */}
          {teams.length > 0 && (
            <>
              <DateFilter
                since={since}
                until={until}
                onSince={setSince}
                onUntil={setUntil}
                onClear={() => {
                  setSince('');
                  setUntil('');
                }}
              />

              <button
                onClick={() => analyseMutation.mutate()}
                disabled={analyseMutation.isPending || teamsToRun.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {analyseMutation.isPending ? (
                  <Spinner size="sm" label="" />
                ) : (
                  <Play size={15} />
                )}
                {analyseMutation.isPending
                  ? 'Running Analysis…'
                  : `▶️ Run Analysis (${teamsToRun.length} team${teamsToRun.length !== 1 ? 's' : ''})`}
              </button>

              {analyseMutation.isError && (
                <Alert variant="error">
                  {(analyseMutation.error as Error).message}
                </Alert>
              )}
            </>
          )}

          {/* Per-team tables after analysis */}
          {analysisResult && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Team Details
              </h3>
              {analysisResult.map((t) => (
                <MemberTable
                  key={t.team_name}
                  teamName={t.team_name}
                  members={t.members}
                  totals={t.totals}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Ranking ────────────────────────────────────────────────────────── */}
      {page === 'ranking' &&
        (analysisResult ? (
          <RankingTable teams={analysisResult} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <Trophy size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No analysis data yet.</p>
            <button
              onClick={() => setPage('workspace')}
              className="mt-3 text-sm text-brand-600 hover:underline"
            >
              Go to Workspace → Run Analysis
            </button>
          </div>
        ))}
    </div>
  );
}
