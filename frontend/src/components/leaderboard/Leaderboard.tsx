/**
 * Team Leaderboard
 *
 * Teams are loaded from the DB roster (read-only here).
 * Mentors organize intern monitoring through mentor groups in Compliance.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Play, Trophy, Briefcase, Database } from 'lucide-react';
import { analyzeTeams, getMentorGroupMembers, getTeams } from '../../api';
import { useLeaderboardStore } from '../../stores/leaderboardStore';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { DateFilter } from './DateFilter';
import { MemberTable } from './MemberTable';
import { RankingTable } from './RankingTable';
import { cn } from '../../lib/utils';
import { useRouter } from '../../lib/router';
import type { Team, TeamResult } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useMentorGroupStore } from '../../stores/mentorGroupStore';

type Page = 'workspace' | 'ranking';

export function Leaderboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { setTeams } = useLeaderboardStore();
  const activeGroup = useMentorGroupStore((state) => state.activeGroup);
  const isMentor = user?.role === 'mentor';
  const [page, setPage] = useState<Page>('workspace');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [analysisResult, setAnalysisResult] = useState<TeamResult[] | null>(
    null
  );
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    enabled: !isMentor,
  });
  const mentorGroupMembersQuery = useQuery({
    queryKey: ['mentor-group-members', activeGroup?.id],
    queryFn: () => getMentorGroupMembers(activeGroup?.id as number),
    enabled: isMentor && !!activeGroup?.id,
  });

  const mentorMembersWithGitlab = useMemo(
    () =>
      (mentorGroupMembersQuery.data ?? []).filter((member) =>
        Boolean(member.gitlab_username?.trim())
      ),
    [mentorGroupMembersQuery.data]
  );

  const mentorTeam = useMemo<Team[]>(
    () =>
      activeGroup?.id
        ? [
            {
              team_name: activeGroup.name,
              project_name: '',
              scope: 'mentor-group',
              members: mentorMembersWithGitlab.map((member) => ({
                username: member.gitlab_username!.trim(),
              })),
            },
          ]
        : [],
    [activeGroup?.id, activeGroup?.name, mentorMembersWithGitlab]
  );

  const teams = useMemo<Team[]>(
    () => (isMentor ? mentorTeam : (teamsQuery.data ?? [])),
    [isMentor, mentorTeam, teamsQuery.data]
  );

  useEffect(() => {
    setTeams(teams);
  }, [setTeams, teams]);

  const teamsToRun = isMentor
    ? teams
    : selectedTeams.size > 0
      ? teams.filter((t) => selectedTeams.has(t.team_name))
      : teams;

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

      {page === 'workspace' && (
        <div className="space-y-5">
          {!isMentor && teamsQuery.isLoading && (
            <Spinner label="Loading teams from roster…" />
          )}
          {isMentor && activeGroup?.id && mentorGroupMembersQuery.isLoading && (
            <Spinner label="Loading active mentor group…" />
          )}
          {!isMentor && teamsQuery.isError && (
            <Alert variant="error">{(teamsQuery.error as Error).message}</Alert>
          )}
          {isMentor && mentorGroupMembersQuery.isError && (
            <Alert variant="error">
              {(mentorGroupMembersQuery.error as Error).message}
            </Alert>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
            <Database size={13} />
            <span>
              {isMentor ? (
                <>
                  Mentor analytics are scoped to your active{' '}
                  <button
                    className="font-semibold underline"
                    onClick={() => navigate('/compliance/mentor-groups')}
                  >
                    Mentor Group
                  </button>
                  .
                </>
              ) : (
                <>
                  Teams are managed in{' '}
                  <button
                    className="font-semibold underline"
                    onClick={() => navigate('/compliance/mentor-groups')}
                  >
                    Mentor Groups
                  </button>
                  . Select teams below, then run analysis.
                </>
              )}
            </span>
          </div>

          {isMentor && !activeGroup?.id && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Database size={32} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-500">
                Select an active mentor group before running leaderboard
                analytics.
              </p>
              <button
                className="mt-2 text-sm text-brand-600 hover:underline"
                onClick={() => navigate('/compliance/mentor-groups')}
              >
                Go to Mentor Groups →
              </button>
            </div>
          )}

          {!isMentor && teams.length === 0 && !teamsQuery.isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Database size={32} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-500">
                No teams found in the roster.
              </p>
              <button
                className="mt-2 text-sm text-brand-600 hover:underline"
                onClick={() => navigate('/compliance/mentor-groups')}
              >
                Go to Mentor Groups to organize interns →
              </button>
            </div>
          )}

          {isMentor && activeGroup?.id && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Active group: {activeGroup.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {mentorMembersWithGitlab.length} GitLab-linked intern(s)
                    included
                    {mentorGroupMembersQuery.data &&
                    mentorGroupMembersQuery.data.length !==
                      mentorMembersWithGitlab.length
                      ? ` · ${mentorGroupMembersQuery.data.length - mentorMembersWithGitlab.length} skipped without GitLab usernames`
                      : ''}
                  </p>
                </div>
                <Badge variant="default">
                  {mentorMembersWithGitlab.length}
                </Badge>
              </div>
            </div>
          )}

          {!isMentor && teams.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
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
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
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

          {teams.length > 0 && (!isMentor || !!activeGroup?.id) && (
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
                disabled={
                  analyseMutation.isPending ||
                  teamsToRun.length === 0 ||
                  (isMentor && mentorMembersWithGitlab.length === 0)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {analyseMutation.isPending ? (
                  <Spinner size="sm" label="" />
                ) : (
                  <Play size={15} />
                )}
                {analyseMutation.isPending
                  ? 'Running Analysis…'
                  : isMentor
                    ? `▶️ Run Analysis (${activeGroup?.name})`
                    : `▶️ Run Analysis (${teamsToRun.length} team${teamsToRun.length !== 1 ? 's' : ''})`}
              </button>

              {analyseMutation.isError && (
                <Alert variant="error">
                  {(analyseMutation.error as Error).message}
                </Alert>
              )}
            </>
          )}

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
