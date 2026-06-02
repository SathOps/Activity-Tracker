/**
 * Roster Management (Admin Panel)
 *
 * Mirrors the Streamlit Admin: Roster Management page.
 * Batch → Team → User hierarchy with CSV bulk import.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Users, Layers } from 'lucide-react';
import {
  getBatches,
  createBatch,
  deleteBatch,
} from '../../services/api/batches';
import {
  getUsers,
  deleteUser,
  bulkImportUsers,
} from '../../services/api/users';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import type { BatchRecord, UserRecord } from '../../types';

function BatchPanel() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');

  const {
    data: batches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const createMutation = useMutation({
    mutationFn: () => createBatch(newName.trim(), newDate.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      setNewName('');
      setNewDate('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <Alert variant="error" title="Failed to load batches">
        {(error as Error).message}
      </Alert>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Add New Batch
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Batch name e.g. Winter 2025"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="text"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            placeholder="Period (optional)"
            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {createMutation.isError && (
          <p className="mt-2 text-xs text-red-600">
            {(createMutation.error as Error).message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {batches.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">
            No batches yet. Create one above.
          </p>
        )}
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{batch.name}</p>
              <p className="text-xs text-slate-400">
                {batch.date || 'No period'} · {batch.team_count} team(s) ·{' '}
                {batch.member_count} user(s)
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete batch "${batch.name}" and ALL its teams/users?`
                  )
                ) {
                  void deleteMutation.mutate(batch.id);
                }
              }}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete batch (cascade)"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportPanel({ batches }: { batches: BatchRecord[] }) {
  const qc = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: () => bulkImportUsers(Number(selectedBatchId), file as File),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
    },
  });

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">
        Bulk Import via CSV
      </h3>
      <p className="text-xs text-slate-500">
        CSV columns:{' '}
        <code>
          team_name, name, gitlab_username, corpus_username, global_username,
          global_email, date_of_joining, college_name
        </code>
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-xs font-medium text-slate-600"
            htmlFor="roster-import-batch"
          >
            Target Batch
          </label>
          <select
            id="roster-import-batch"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(Number(e.target.value) || '')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Select batch —</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium text-slate-600"
            htmlFor="roster-import-file"
          >
            CSV File
          </label>
          <input
            id="roster-import-file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-700"
          />
        </div>
      </div>

      <button
        onClick={() => importMutation.mutate()}
        disabled={!selectedBatchId || !file || importMutation.isPending}
        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        <Upload size={14} />{' '}
        {importMutation.isPending ? 'Importing…' : 'Import'}
      </button>

      {result && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-green-700">
            ✅ {result.imported} user(s) imported
          </p>
          {result.errors.map((error, index) => (
            <p key={`${index}-${error}`} className="text-xs text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
      {importMutation.isError && (
        <p className="text-xs text-red-600">
          {(importMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const filtered = users.filter(
    (appUser) =>
      !search ||
      appUser.name.toLowerCase().includes(search.toLowerCase()) ||
      (appUser.gitlab_username || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      appUser.team_name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Record<string, UserRecord[]>> = {};
  filtered.forEach((appUser) => {
    const batchKey = appUser.batch_name || 'No Batch';
    const teamKey = appUser.team_name;
    if (!grouped[batchKey]) grouped[batchKey] = {};
    if (!grouped[batchKey][teamKey]) grouped[batchKey][teamKey] = [];
    grouped[batchKey][teamKey].push(appUser);
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, username or team…"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      {Object.keys(grouped).length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          No users found.
        </p>
      )}

      {Object.entries(grouped).map(([batchName, teams]) => (
        <div
          key={batchName}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <Layers size={13} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">
              {batchName}
            </span>
          </div>

          {Object.entries(teams).map(([teamName, teamUsers]) => (
            <div key={teamName}>
              <div className="flex items-center gap-2 border-b border-slate-100 bg-blue-50 px-4 py-2">
                <Users size={12} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">
                  {teamName}
                </span>
                <Badge variant="info">{teamUsers.length}</Badge>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">GitLab</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Institution
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Joined</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {teamUsers.map((appUser) => (
                    <tr
                      key={appUser.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {appUser.name}
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-600">
                        @{appUser.gitlab_username || '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {appUser.institution_name || '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {appUser.date_of_joining || '—'}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => {
                            if (
                              confirm(`Remove ${appUser.name} from the roster?`)
                            ) {
                              void deleteMutation.mutate(appUser.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-600"
                          title="Remove user"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

type RosterTab = 'batches' | 'import' | 'users';

export function RosterManagement() {
  const [tab, setTab] = useState<RosterTab>('batches');
  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const tabs: { id: RosterTab; label: string }[] = [
    { id: 'batches', label: '📦 Batches' },
    { id: 'import', label: '📥 CSV Import' },
    { id: 'users', label: '👥 Users' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          🗂️ Roster Management
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage batches, teams, and internship users. Import rosters via CSV.
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setTab(entry.id)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === entry.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'batches' && <BatchPanel />}
      {tab === 'import' && <ImportPanel batches={batches} />}
      {tab === 'users' && <UsersPanel />}
    </div>
  );
}
