import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload } from 'lucide-react';
import { getBatches } from '../../services/api/batches';
import {
  bulkImportUsers,
  createUser,
  deleteUser,
  getUsers,
  searchUsers,
} from '../../services/api/users';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';

interface UserDraft {
  name: string;
  corpus_username: string;
  batch_id: number | '';
  team_name: string;
  gitlab_username: string;
  institution_name: string;
}

const EMPTY_DRAFT: UserDraft = {
  name: '',
  corpus_username: '',
  batch_id: '',
  team_name: '',
  gitlab_username: '',
  institution_name: '',
};

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

export function MembersPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [importBatchId, setImportBatchId] = useState<number | ''>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const usersQuery = useQuery({
    queryKey: ['users', debouncedQuery],
    queryFn: () =>
      debouncedQuery.trim() ? searchUsers(debouncedQuery.trim()) : getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createUser({
        name: draft.name.trim(),
        corpus_username: draft.corpus_username.trim(),
        batch_id: Number(draft.batch_id),
        team_name: draft.team_name.trim() || undefined,
        gitlab_username: draft.gitlab_username.trim() || undefined,
        institution_name: draft.institution_name.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      setDraft(EMPTY_DRAFT);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: () =>
      bulkImportUsers(Number(importBatchId), importFile as File),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      setImportResult(result);
    },
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  if (
    (batchesQuery.isLoading && !batchesQuery.data) ||
    (usersQuery.isLoading && !usersQuery.data)
  ) {
    return <Spinner label="Loading users…" />;
  }

  if (batchesQuery.isError || usersQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load users">
        {((batchesQuery.error || usersQuery.error) as Error).message}
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      {isAdmin ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className={glassCard} style={{ padding: '24px 28px' }}>
            <h2 className="m-0 text-lg font-bold font-display text-slate-900 dark:text-slate-100">
              Add user
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create users directly in the backend roster.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
              />
              <input
                type="text"
                value={draft.corpus_username}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    corpus_username: event.target.value,
                  }))
                }
                placeholder="Corpus username"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
              />
              <select
                value={draft.batch_id}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    batch_id: Number(event.target.value) || '',
                  }))
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
              <input
                type="text"
                value={draft.team_name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    team_name: event.target.value,
                  }))
                }
                placeholder="Team name (optional)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
              />
              <input
                type="text"
                value={draft.gitlab_username}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    gitlab_username: event.target.value,
                  }))
                }
                placeholder="GitLab username"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
              />
              <input
                type="text"
                value={draft.institution_name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    institution_name: event.target.value,
                  }))
                }
                placeholder="Institution"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => void createMutation.mutate()}
              disabled={
                !draft.name.trim() ||
                !draft.corpus_username.trim() ||
                !draft.batch_id ||
                createMutation.isPending
              }
              className="mt-4 inline-flex items-center gap-2 px-[18px] py-2.5 rounded-xl border-none bg-gradient-to-br from-indigo-600 to-indigo-500 text-white text-[13px] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 disabled:opacity-50"
            >
              <Plus size={14} />
              Add user
            </button>
          </div>

          <div className={glassCard} style={{ padding: '24px 28px' }}>
            <h2 className="m-0 text-lg font-bold font-display text-slate-900 dark:text-slate-100">
              CSV import
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seed roster data through the backend import pipeline.
            </p>

            <div className="mt-5 space-y-3">
              <select
                value={importBatchId}
                onChange={(event) =>
                  setImportBatchId(Number(event.target.value) || '')
                }
                className="w-full rounded-xl border border-slate-300/60 dark:border-white/10 px-3.5 py-2.5 text-sm bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
              >
                <option value="">Select target batch</option>
                {batchesQuery.data?.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept=".csv"
                onChange={(event) =>
                  setImportFile(event.target.files?.[0] ?? null)
                }
                className="w-full text-sm text-slate-650 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-600/10 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-blue-500 file:hover:bg-blue-600/20 transition-all"
              />
              <button
                type="button"
                onClick={() => void importMutation.mutate()}
                disabled={
                  !importBatchId || !importFile || importMutation.isPending
                }
                className="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 border-none outline-none"
              >
                <Upload size={14} />
                Import CSV
              </button>
            </div>

            {importResult ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-900">
                  Imported {importResult.imported} user(s)
                </p>
                {importResult.errors.map((error) => (
                  <p key={error} className="mt-2 text-red-600">
                    {error}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={blueGlassCard} style={{ padding: '24px 28px' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="m-0 text-lg font-bold font-display text-slate-900 dark:text-slate-100">
              Users
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by name or Corpus username. Mentors only see batch-scoped
              users.
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            className="w-full max-w-sm rounded-xl border border-slate-300/60 dark:border-white/10 px-4 py-2 text-sm bg-white/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200"
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Corpus</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Batch</th>
                <th className="px-3 py-3 font-medium">Team</th>
                <th className="px-3 py-3 font-medium">GitLab</th>
                {isAdmin ? (
                  <th className="px-3 py-3 font-medium">Action</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {users.map((appUser) => (
                <tr key={appUser.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {appUser.name}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {appUser.corpus_username}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {appUser.role || 'intern'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {appUser.batch_name || 'Unassigned'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {appUser.team_name}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {appUser.gitlab_username || 'Not linked'}
                  </td>
                  {isAdmin ? (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete user "${appUser.name}" (${appUser.corpus_username})?`
                            )
                          ) {
                            void deleteMutation.mutate(appUser.id);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
