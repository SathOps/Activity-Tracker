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
  'relative z-10 rounded-[24px] backdrop-blur-[var(--glass-blur)] ' +
  'transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ' +
  'bg-[rgba(255,255,255,0.55)] border border-[rgba(255,255,255,0.7)] ' +
  'shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ' +
  'hover:bg-[rgba(255,255,255,0.65)] hover:border-[rgba(30,79,178,0.25)] ' +
  'hover:shadow-[0_20px_40px_-15px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] ' +
  'dark:bg-[rgba(15,23,42,0.45)] dark:border-[rgba(255,255,255,0.06)] ' +
  'dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] ' +
  'dark:hover:bg-[rgba(15,23,42,0.55)] dark:hover:border-[rgba(56,189,248,0.25)] ' +
  'dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.65),0_0_20px_rgba(56,189,248,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]';

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
        <div className={glassCard} style={{ padding: '24px 28px' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--slate-900)',
                }}
              >
                Teams
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 14,
                  color: 'var(--slate-500)',
                }}
              >
                Review active teams by batch and open full team breakdowns.
              </p>
            </div>
            <select
              value={selectedBatchId}
              onChange={(event) => {
                const raw = event.target.value;
                setSelectedBatchId(raw === 'all' ? 'all' : Number(raw));
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                border: '1px solid var(--slate-200)',
                background: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                color: 'var(--slate-700)',
                outline: 'none',
              }}
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <select
                value={newTeamBatchId}
                onChange={(event) =>
                  setNewTeamBatchId(Number(event.target.value) || '')
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity:
                    !newTeamName.trim() ||
                    !newTeamBatchId ||
                    createMutation.isPending
                      ? 0.5
                      : 1,
                  boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                }}
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
                className={glassCard}
                style={{ padding: '22px 24px' }}
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
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    {teamDetailQuery.isLoading ? (
                      <Spinner label="Loading team detail…" />
                    ) : teamDetailQuery.isError ? (
                      <Alert variant="error">
                        {(teamDetailQuery.error as Error).message}
                      </Alert>
                    ) : selectedTeamDetail ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg bg-white px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Active users
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {selectedTeamDetail.member_count}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Started
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {selectedTeamDetail.start_date || 'Not set'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Closed
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {selectedTeamDetail.end_date || 'Active'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-white p-4">
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
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
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

      <aside
        className={glassCard}
        style={{ padding: '24px 28px', alignSelf: 'start' }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--slate-900)',
          }}
        >
          Team operations
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--slate-500)',
          }}
        >
          Team creation, roster changes, and membership history now use backend
          APIs directly. This keeps Standup Tracker and Compliance Checker on
          the same source of truth.
        </p>
        <ul
          style={{
            marginTop: 20,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 14,
            color: 'var(--slate-600)',
          }}
        >
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
