import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignUserRole, getUsers, searchUsers } from '../../api';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types';

const ROLE_OPTIONS: UserRole[] = ['intern', 'mentor', 'admin'];

export function RolesPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');

  const usersQuery = useQuery({
    queryKey: ['role-users', query],
    queryFn: () => (query.trim() ? searchUsers(query.trim()) : getUsers()),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      assignUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['role-users'] });
    },
  });

  if (usersQuery.isLoading) {
    return <Spinner label="Loading role assignments…" />;
  }

  if (usersQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load users for role assignment">
        {(usersQuery.error as Error).message}
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Role assignment
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Promote users to admin or mentor. Everyone else remains an intern by
          default.
        </p>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users"
          className="mt-4 w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4">
        {usersQuery.data?.map((appUser) => (
          <article
            key={appUser.id}
            className="glass-card"
            style={{ padding: '24px 28px' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {appUser.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {appUser.corpus_username} · {appUser.batch_name || 'No batch'}{' '}
                  · {appUser.team_name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const active = (appUser.role || 'intern') === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        void assignMutation.mutate({
                          userId: appUser.id,
                          role,
                        })
                      }
                      disabled={active || assignMutation.isPending}
                      className={
                        active
                          ? 'rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white'
                          : 'rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600'
                      }
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
