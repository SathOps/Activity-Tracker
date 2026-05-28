import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignMemberRole,
  getMembers,
  searchMembers,
  updateMemberPermissions,
} from '../../api';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types';

const ROLE_OPTIONS: UserRole[] = ['intern', 'mentor', 'admin'];

export function RolesPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');

  const membersQuery = useQuery({
    queryKey: ['role-members', query],
    queryFn: () => (query.trim() ? searchMembers(query.trim()) : getMembers()),
  });

  const assignMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: UserRole }) =>
      assignMemberRole(memberId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['role-members'] });
    },
  });

  const permissionMutation = useMutation({
    mutationFn: ({
      memberId,
      canEditStandup,
    }: {
      memberId: number;
      canEditStandup: boolean;
    }) => updateMemberPermissions(memberId, canEditStandup),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['role-members'] });
    },
  });

  if (membersQuery.isLoading) {
    return <Spinner label="Loading role assignments…" />;
  }

  if (membersQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load users for role assignment">
        {(membersQuery.error as Error).message}
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
          Promote users to admin or mentor, and grant standup edit permission
          without changing their base role.
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
        {membersQuery.data?.map((member) => (
          <article
            key={member.id}
            className="glass-card"
            style={{ padding: '24px 28px' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {member.corpus_username} · {member.batch_name || 'No batch'} ·{' '}
                  {member.team_name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const active = (member.role || 'intern') === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        void assignMutation.mutate({
                          memberId: member.id,
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
                <button
                  type="button"
                  onClick={() =>
                    void permissionMutation.mutate({
                      memberId: member.id,
                      canEditStandup: !member.can_edit_standup,
                    })
                  }
                  disabled={permissionMutation.isPending}
                  className={
                    member.can_edit_standup
                      ? 'rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white'
                      : 'rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700'
                  }
                >
                  {member.can_edit_standup
                    ? 'Standup Edit On'
                    : 'Standup Edit Off'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
