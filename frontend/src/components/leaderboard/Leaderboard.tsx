import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trophy, Briefcase } from 'lucide-react';
import { analyzeTeams } from '../../api';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { MemberTable } from './MemberTable';
import { RankingTable } from './RankingTable';
import {
  HierarchicalSelector,
  type SelectorOutput,
} from '../shared/HierarchicalSelector';
import { cn } from '../../lib/utils';
import type { Team, TeamResult } from '../../types';
import toast from 'react-hot-toast';

type Page = 'workspace' | 'ranking';

export function Leaderboard() {
  const [page, setPage] = useState<Page>('workspace');
  const [analysisResult, setAnalysisResult] = useState<TeamResult[] | null>(
    null
  );

  const analyseMutation = useMutation({
    mutationFn: (output: SelectorOutput) => {
      // Group selected users back into their teams
      const teamMap = new Map<string, string[]>();
      for (const appUser of output.users) {
        if (!appUser.gitlab_username) continue;
        const key = appUser.team_name || 'Unknown Team';
        if (!teamMap.has(key)) teamMap.set(key, []);
        teamMap.get(key)!.push(appUser.gitlab_username);
      }

      const teams: Team[] = Array.from(teamMap.entries()).map(
        ([teamName, members]) => ({
          team_name: teamName,
          project_name: '',
          members: members.map((username) => ({ username })),
        })
      );

      const sinceISO = output.startDate
        ? new Date(output.startDate).toISOString()
        : undefined;
      const untilISO = output.endDate
        ? new Date(output.endDate + 'T23:59:59').toISOString()
        : undefined;

      return analyzeTeams(teams, sinceISO, untilISO);
    },
    onSuccess: (results) => {
      setAnalysisResult(results);
      setPage('ranking');
      toast.success('Analysis complete!');
    },
    onError: (e: Error) => toast.error(`Analysis failed: ${e.message}`),
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          🏆 Team Leaderboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select batches, teams, and users to compare GitLab activity scores.{' '}
          <span className="font-medium text-slate-600">
            Score = Commits×1 + Merged MRs×5 + Total MRs×2 + Issues Closed×3
          </span>
        </p>
      </div>

      {/* Page tabs */}
      <div className="mb-6 flex gap-2">
        {(
          [
            ['workspace', 'Workspace', 'briefcase'],
            ['ranking', 'Leaderboard Ranking', 'trophy'],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
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
            )}
            {label}
          </button>
        ))}
      </div>

      {page === 'workspace' && (
        <div className="space-y-5">
          {/* Hierarchical selector */}
          <HierarchicalSelector
            runLabel="Run Analysis"
            isRunning={analyseMutation.isPending}
            onRun={(output) => analyseMutation.mutate(output)}
          />

          {analyseMutation.isPending && (
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Spinner size="sm" label="" />
              Analysing {analyseMutation.variables?.users.length ?? 0} user(s)…
            </div>
          )}

          {analyseMutation.isError && (
            <Alert variant="error">
              {(analyseMutation.error as Error).message}
            </Alert>
          )}

          {/* Inline results while on workspace tab */}
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

      {page === 'ranking' &&
        (analysisResult ? (
          <RankingTable teams={analysisResult} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <Trophy size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-500">No analysis data yet.</p>
            <button
              type="button"
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
