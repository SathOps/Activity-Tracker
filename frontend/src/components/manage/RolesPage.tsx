import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import {
  assignUserRole,
  getUsers,
  searchUsers,
} from '../../services/api/users';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types';

const ROLE_OPTIONS: UserRole[] = ['intern', 'mentor', 'admin'];

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

export function RolesPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const usersQuery = useQuery({
    queryKey: ['role-users', debouncedQuery],
    queryFn: () =>
      debouncedQuery.trim() ? searchUsers(debouncedQuery.trim()) : getUsers(),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      assignUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['role-users'] });
    },
  });

  const filteredUsers = useMemo(() => {
    const list = usersQuery.data ?? [];
    if (selectedRole === 'all') return list;
    return list.filter((u) => (u.role || 'intern') === selectedRole);
  }, [usersQuery.data, selectedRole]);

  if (usersQuery.isLoading && !usersQuery.data) {
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
      <div className={glassCard} style={{ padding: '24px 28px' }}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
          Role assignment
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Promote users to admin or mentor. Everyone else remains an intern by
          default.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            className="w-full max-w-sm px-4 py-2 bg-slate-500/5 dark:bg-slate-950/20 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
          />
          <div className="relative w-40">
            <select
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(event.target.value as UserRole | 'all')
              }
              className="w-full appearance-none pr-10 pl-4 py-2 bg-slate-500/5 dark:bg-slate-950/20 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
            >
              <option
                value="all"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                All Roles
              </option>
              <option
                value="intern"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                Intern
              </option>
              <option
                value="mentor"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                Mentor
              </option>
              <option
                value="admin"
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                Admin
              </option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((appUser) => (
          <article
            key={appUser.id}
            className={glassCard}
            style={{ padding: '24px 28px' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {appUser.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-transparent shadow-md shadow-blue-500/20'
                          : 'bg-slate-500/5 dark:bg-white/5 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-500/10 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
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
