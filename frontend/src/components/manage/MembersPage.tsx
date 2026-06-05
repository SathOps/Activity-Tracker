import { useMemo, useState } from 'react';
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

export function MembersPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [importBatchId, setImportBatchId] = useState<number | ''>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const usersQuery = useQuery({
    queryKey: ['users', query],
    queryFn: () => (query.trim() ? searchUsers(query.trim()) : getUsers()),
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

  if (batchesQuery.isLoading || usersQuery.isLoading) {
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
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: 'var(--slate-900)',
              }}
            >
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
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
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
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <select
                value={draft.batch_id}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    batch_id: Number(event.target.value) || '',
                  }))
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
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
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
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
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
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--slate-200)',
                  background: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  outline: 'none',
                }}
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
              style={{
                marginTop: 16,
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
                boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
              }}
            >
              <Plus size={14} />
              Add user
            </button>
          </div>

          <div className={glassCard} style={{ padding: '24px 28px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: 'var(--slate-900)',
              }}
            >
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
              />
              <button
                type="button"
                onClick={() => void importMutation.mutate()}
                disabled={
                  !importBatchId || !importFile || importMutation.isPending
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--slate-900)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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

      <div className={glassCard} style={{ padding: '24px 28px' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
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
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
