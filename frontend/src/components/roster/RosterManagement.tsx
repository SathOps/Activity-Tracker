/**
 * Roster Management (Admin Panel)
 *
 * Mirrors the Streamlit Admin: Roster Management page.
 * Batch → Team → Member hierarchy with CSV bulk import.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Users, Layers } from 'lucide-react';
import {
  getBatches,
  createBatch,
  deleteBatch,
  getMembers,
  deleteMember,
  bulkImportMembers,
} from '../../api';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import type { BatchRecord, MemberRecord } from '../../types';

// ── Batch panel ───────────────────────────────────────────────────────────────

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
      {/* Create batch */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
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

      {/* Batch list */}
      <div className="space-y-2">
        {batches.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No batches yet. Create one above.
          </p>
        )}
        {batches.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{b.name}</p>
              <p className="text-xs text-slate-400">
                {b.date || 'No period'} · {b.team_count} team(s) ·{' '}
                {b.member_count} member(s)
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  confirm(`Delete batch "${b.name}" and ALL its teams/members?`)
                ) {
                  void deleteMutation.mutate(b.id);
                }
              }}
              className="text-red-400 hover:text-red-600 p-1"
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

// ── CSV Import panel ──────────────────────────────────────────────────────────

function ImportPanel({ batches }: { batches: BatchRecord[] }) {
  const qc = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: () => bulkImportMembers(Number(selectedBatchId), file!),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['batches'] });
    },
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">
        Bulk Import via CSV
      </h3>
      <p className="text-xs text-slate-500">
        CSV columns:{' '}
        <code>
          team_name, name, gitlab_username, gitlab_email, corpus_username,
          global_username, global_email, date_of_joining, college_name
        </code>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium text-slate-600 mb-1"
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
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-xs font-medium text-slate-600 mb-1"
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
          <p className="text-sm text-green-700 font-medium">
            ✅ {result.imported} member(s) imported
          </p>
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600">
              {e}
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

// ── Members panel ─────────────────────────────────────────────────────────────

function MembersPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });

  const filtered = members.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.gitlab_username || '').toLowerCase().includes(search.toLowerCase()) ||
      m.team_name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by batch → team
  const grouped: Record<string, Record<string, MemberRecord[]>> = {};
  filtered.forEach((m) => {
    const batchKey = m.batch_name || 'No Batch';
    const teamKey = m.team_name;
    if (!grouped[batchKey]) grouped[batchKey] = {};
    if (!grouped[batchKey][teamKey]) grouped[batchKey][teamKey] = [];
    grouped[batchKey][teamKey].push(m);
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
        <p className="text-sm text-slate-500 text-center py-8">
          No members found.
        </p>
      )}

      {Object.entries(grouped).map(([batchName, teams]) => (
        <div
          key={batchName}
          className="rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <Layers size={13} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">
              {batchName}
            </span>
          </div>

          {Object.entries(teams).map(([teamName, teamMembers]) => (
            <div key={teamName}>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-slate-100">
                <Users size={12} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">
                  {teamName}
                </span>
                <Badge variant="info">{teamMembers.length}</Badge>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">GitLab</th>
                    <th className="px-4 py-2 text-left font-medium">College</th>
                    <th className="px-4 py-2 text-left font-medium">Joined</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {m.name}
                      </td>
                      <td className="px-4 py-2 text-slate-600 font-mono">
                        @{m.gitlab_username}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {m.college_name || '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {m.date_of_joining || '—'}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name} from the roster?`)) {
                              void deleteMutation.mutate(m.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-600"
                          title="Remove member"
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

// ── Main component ────────────────────────────────────────────────────────────

type RosterTab = 'batches' | 'import' | 'members';

export function RosterManagement() {
  const [tab, setTab] = useState<RosterTab>('batches');
  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const tabs: { id: RosterTab; label: string }[] = [
    { id: 'batches', label: '📦 Batches' },
    { id: 'import', label: '📥 CSV Import' },
    { id: 'members', label: '👥 Members' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          🗂️ Roster Management
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage batches, teams, and intern members. Import rosters via CSV.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'batches' && <BatchPanel />}
      {tab === 'import' && <ImportPanel batches={batches} />}
      {tab === 'members' && <MembersPanel />}
    </div>
  );
}
