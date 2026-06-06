import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, Users, X } from 'lucide-react';
import { getBatches } from '../../services/api/batches';
import {
  addUserToTeam,
  createTeam,
  deleteTeam,
  getRosterTeams,
  getTeamDetail,
  removeUserFromTeam,
  updateTeam,
} from '../../services/api/teams';
import { useAuth } from '../../contexts/AuthContext';
import type { TeamDetailRecord, TeamRecord } from '../../types';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';

/* ── Shared glass card style ─────────────────────────────── */
const glassCard =
  'relative z-10 rounded-[24px] backdrop-blur-xl ' +
  'bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 ' +
  'shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)] ' +
  'transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ' +
  'hover:bg-white/60 dark:hover:bg-slate-900/55 hover:border-blue-500/35 hover:shadow-xl dark:hover:shadow-blue-900/10';

const blueGlassCard =
  'relative z-10 rounded-[24px] backdrop-blur-xl ' +
  'bg-white/45 dark:bg-slate-900/45 border border-blue-200/80 dark:border-blue-500/25 ' +
  'shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)] ' +
  'transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ' +
  'hover:bg-white/60 dark:hover:bg-slate-900/55 hover:border-blue-500/50 dark:hover:border-blue-400/40 hover:shadow-xl dark:hover:shadow-blue-900/10';

export function TeamsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedBatchId, setSelectedBatchId] = useState<number | 'all'>('all');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamBatchId, setNewTeamBatchId] = useState<number | ''>('');
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [userDrafts, setUserDrafts] = useState<Record<number, string>>({});

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const teamsQuery = useQuery({
    queryKey: ['teams', selectedBatchId],
    queryFn: () =>
      getRosterTeams(false).then((teams) =>
        selectedBatchId === 'all'
          ? teams
          : teams.filter((team) => team.batch_id === selectedBatchId)
      ),
  });

  const teamDetailQuery = useQuery({
    queryKey: ['team-detail', expandedTeamId],
    queryFn: () => getTeamDetail(expandedTeamId as number),
    enabled: expandedTeamId !== null,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTeam({
        name: newTeamName.trim(),
        batch_id: Number(newTeamBatchId),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      setNewTeamName('');
      setNewTeamBatchId('');
    },
  });

  const renameMutation = useMutation({
    mutationFn: (team: TeamRecord) =>
      updateTeam(team.id, editingTeamName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team-detail', expandedTeamId] });
      setEditingTeamId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => deleteTeam(teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      setExpandedTeamId(null);
    },
  });

  const addUserMutation = useMutation({
    mutationFn: ({
      teamId,
      corpusUsername,
    }: {
      teamId: number;
      corpusUsername: string;
    }) => addUserToTeam(teamId, corpusUsername),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-detail', expandedTeamId] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      removeUserFromTeam(teamId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-detail', expandedTeamId] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const selectedTeamDetail = teamDetailQuery.data as
    | TeamDetailRecord
    | undefined;

  if (batchesQuery.isLoading || teamsQuery.isLoading) {
    return <Spinner label="Loading teams…" />;
  }

  if (batchesQuery.isError || teamsQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load team management">
        {((batchesQuery.error || teamsQuery.error) as Error).message}
      </Alert>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className={`${glassCard} p-4 sm:p-5 md:p-[24px_28px]`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-lg font-bold font-display text-slate-900 dark:text-slate-100">
                Teams
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review active teams by batch and open full team breakdowns.
              </p>
            </div>
            <select
              value={selectedBatchId}
              onChange={(event) => {
                const raw = event.target.value;
                setSelectedBatchId(raw === 'all' ? 'all' : Number(raw));
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer backdrop-blur-sm"
            >
              <option value="all">All batches</option>
              {batchesQuery.data?.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          {isAdmin ? (
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_0.9fr_auto]">
              <input
                type="text"
                value={newTeamName}
                onChange={(event) => setNewTeamName(event.target.value)}
                placeholder="Team name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
              />
              <select
                value={newTeamBatchId}
                onChange={(event) =>
                  setNewTeamBatchId(Number(event.target.value) || '')
                }
                className="px-3.5 py-2.5 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-450 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm cursor-pointer"
              >
                <option value="">Select batch</option>
                {batchesQuery.data?.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void createMutation.mutate()}
                disabled={
                  !newTeamName.trim() ||
                  !newTeamBatchId ||
                  createMutation.isPending
                }
                className={`inline-flex items-center gap-2 px-[18px] py-2.5 rounded-xl border-none bg-gradient-to-br from-indigo-600 to-indigo-500 text-white text-[13px] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 ${!newTeamName.trim() || !newTeamBatchId || createMutation.isPending ? 'opacity-50' : ''}`}
              >
                <Plus size={14} />
                Create team
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {teams.map((team) => {
            const isEditing = editingTeamId === team.id;
            const isExpanded = expandedTeamId === team.id;

            return (
              <article
                key={team.id}
                className={`${blueGlassCard} p-4 sm:p-5 md:p-[22px_24px]`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingTeamName}
                          onChange={(event) =>
                            setEditingTeamName(event.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => void renameMutation.mutate(team)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTeamId(null)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-slate-900">
                          {team.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {team.batch_name} · {team.member_count} user(s)
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTeamId((current) =>
                          current === team.id ? null : team.id
                        )
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
                    >
                      {isExpanded ? 'Hide details' : 'Open details'}
                    </button>
                    {isAdmin && !isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeamId(team.id);
                            setEditingTeamName(team.name);
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete team "${team.name}" from ${team.batch_name}?`
                              )
                            ) {
                              void deleteMutation.mutate(team.id);
                            }
                          }}
                          className="rounded-lg border border-red-200 p-2 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                    {teamDetailQuery.isLoading ? (
                      <Spinner label="Loading team detail…" />
                    ) : teamDetailQuery.isError ? (
                      <Alert variant="error">
                        {(teamDetailQuery.error as Error).message}
                      </Alert>
                    ) : selectedTeamDetail ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Active users
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {selectedTeamDetail.member_count}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Started
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {selectedTeamDetail.start_date || 'Not set'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Closed
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {selectedTeamDetail.end_date || 'Active'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-white p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">
                                Current users
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Add users by Corpus username or remove current
                                team users.
                              </p>
                            </div>
                            <Users size={16} className="text-slate-400" />
                          </div>

                          {isAdmin ? (
                            <div className="mt-4 flex gap-2">
                              <input
                                type="text"
                                value={userDrafts[team.id] || ''}
                                onChange={(event) =>
                                  setUserDrafts((current) => ({
                                    ...current,
                                    [team.id]: event.target.value,
                                  }))
                                }
                                placeholder="corpus_username"
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  void addUserMutation.mutate({
                                    teamId: team.id,
                                    corpusUsername: (
                                      userDrafts[team.id] || ''
                                    ).trim(),
                                  })
                                }
                                disabled={
                                  !(userDrafts[team.id] || '').trim() ||
                                  addUserMutation.isPending
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                              >
                                Add user
                              </button>
                            </div>
                          ) : null}

                          <div className="mt-4 space-y-2">
                            {selectedTeamDetail.users.map((appUser) => (
                              <div
                                key={appUser.id}
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {appUser.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {appUser.corpus_username} · {appUser.role}
                                  </p>
                                </div>
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void removeUserMutation.mutate({
                                        teamId: team.id,
                                        userId: appUser.id,
                                      })
                                    }
                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      <aside className={`${glassCard} p-4 sm:p-5 md:p-[24px_28px] self-start`}>
        <h2 className="m-0 text-lg font-bold font-display text-slate-900 dark:text-slate-100">
          Team operations
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Team creation, roster changes, and membership history now use backend
          APIs directly. This keeps Standup Tracker and Compliance Checker on
          the same source of truth.
        </p>
        <ul className="mt-5 pl-[18px] flex flex-col gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <li>Use batch filtering to focus mentor-scoped work.</li>
          <li>
            Open a team to inspect current members and historical joins/leaves.
          </li>
          <li>
            Keep direct roster edits here; Standup stays operational, not
            administrative.
          </li>
        </ul>
      </aside>
    </section>
  );
}
