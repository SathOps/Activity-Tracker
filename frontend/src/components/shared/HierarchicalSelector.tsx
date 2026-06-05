import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSelectorTree } from '../../services/api/selector';
import type { BatchRecord, TeamRecord } from '../../types';
import { Spinner } from '../ui/Spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SelectedMember {
  id: number;
  name: string;
  corpus_username: string;
  gitlab_username: string;
  team_id: number;
  team_name: string;
  batch_name: string;
}

export interface SelectorOutput {
  users: SelectedMember[];
  startDate: string;
  endDate: string;
}

interface Props {
  onRun: (output: SelectorOutput) => void;
  runLabel?: string;
  isRunning?: boolean;
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

function MultiSelectDropdown<T extends { id: number; name: string }>({
  label,
  placeholder,
  items,
  selected,
  onChange,
  disabled,
  isLoading,
  renderItem,
}: {
  label: string;
  placeholder: string;
  items: T[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  disabled?: boolean;
  isLoading?: boolean;
  renderItem?: (item: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  function toggleAll() {
    if (selected.size === items.length) onChange(new Set());
    else onChange(new Set(items.map((i) => i.id)));
  }

  const selectedCount = selected.size;
  const triggerLabel =
    selectedCount === 0
      ? placeholder
      : selectedCount === 1
        ? ((renderItem
            ? renderItem(items.find((i) => selected.has(i.id))!)
            : items.find((i) => selected.has(i.id))?.name) ?? placeholder)
        : `${selectedCount} selected`;

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
        {label}
      </p>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`flex w-full items-center justify-between gap-2 rounded-[10px] border border-slate-200 px-3.5 py-[9px] text-left text-[13px] ${
            disabled
              ? 'cursor-not-allowed bg-slate-50'
              : 'cursor-pointer bg-white'
          } ${
            selectedCount === 0
              ? 'font-normal text-slate-400'
              : 'font-medium text-slate-800'
          }`}
        >
          <span className="flex-1 truncate">
            {isLoading ? 'Loading…' : triggerLabel}
          </span>
          {isLoading ? (
            <Spinner size="sm" label="" />
          ) : (
            <span className="text-[10px] text-slate-400">
              {open ? '▲' : '▾'}
            </span>
          )}
        </button>

        {open && !disabled && items.length > 0 && (
          <div className="absolute inset-x-0 top-[calc(100%+4px)] z-50 max-h-[240px] overflow-y-auto rounded-[10px] border border-slate-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            {/* Select all */}
            <label className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-3.5 py-[9px]">
              <input
                type="checkbox"
                checked={selectedCount === items.length && items.length > 0}
                onChange={toggleAll}
                className="accent-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-600">
                Select all ({items.length})
              </span>
            </label>

            {items.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2.5 border-b border-slate-50 px-3.5 py-[9px] hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="accent-indigo-500"
                />
                <span className="flex-1 truncate text-[13px] text-slate-800">
                  {renderItem ? renderItem(item) : item.name}
                </span>
              </label>
            ))}
          </div>
        )}

        {open && !disabled && !isLoading && items.length === 0 && (
          <div className="absolute inset-x-0 top-[calc(100%+4px)] z-50 rounded-[10px] border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-400 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            None available
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main selector ─────────────────────────────────────────────────────────────

export function HierarchicalSelector({
  onRun,
  runLabel = 'Run Analysis',
  isRunning = false,
}: Props) {
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set()
  );
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );

  const selectorQuery = useQuery({
    queryKey: ['selector-tree'],
    queryFn: getSelectorTree,
    staleTime: 5 * 60 * 1000,
  });
  const batches = selectorQuery.data?.batches ?? [];

  const batchIdList = useMemo(
    () => Array.from(selectedBatchIds).sort((a, b) => a - b),
    [selectedBatchIds]
  );
  const teams = useMemo(
    () =>
      (selectorQuery.data?.teams ?? []).filter(
        (team) =>
          batchIdList.length === 0 || batchIdList.includes(team.batch_id ?? -1)
      ),
    [batchIdList, selectorQuery.data?.teams]
  );

  const teamIdList = useMemo(
    () => Array.from(selectedTeamIds).sort((a, b) => a - b),
    [selectedTeamIds]
  );
  const users = useMemo(
    () =>
      (selectorQuery.data?.users ?? []).filter(
        (appUser) =>
          teamIdList.length === 0 || teamIdList.includes(appUser.team_id ?? -1)
      ),
    [selectorQuery.data?.users, teamIdList]
  );

  // Clear downstream selections on upstream change
  function handleBatchChange(next: Set<number>) {
    setSelectedBatchIds(next);
    setSelectedTeamIds(new Set());
    setSelectedUserIds(new Set());
  }

  function handleTeamChange(next: Set<number>) {
    setSelectedTeamIds(next);
    setSelectedUserIds(new Set());
  }

  // Collect valid (has gitlab_username) selected users
  const validUsers = users.filter(
    (appUser) => !!appUser.gitlab_username?.trim()
  );
  const selectedUsers = validUsers.filter((appUser) =>
    selectedUserIds.has(appUser.id)
  );

  const showMultipleBatches = selectedBatchIds.size > 1;

  function handleRun() {
    const output: SelectorOutput = {
      users: selectedUsers.map((appUser) => ({
        id: appUser.id,
        name: appUser.name,
        corpus_username: appUser.corpus_username,
        gitlab_username: appUser.gitlab_username!.trim(),
        team_id: appUser.team_id ?? 0,
        team_name: appUser.team_name ?? '',
        batch_name: appUser.batch_name ?? '',
      })),
      startDate,
      endDate,
    };
    onRun(output);
  }

  const canRun =
    selectedUsers.length > 0 && !!startDate && !!endDate && !isRunning;

  return (
    <div className="flex flex-col gap-[18px] rounded-2xl border border-slate-200 bg-white px-6 py-5">
      {/* Empty state for no batches */}
      {!selectorQuery.isLoading && batches.length === 0 && (
        <p className="py-3 text-center text-[13px] text-slate-400">
          No batches assigned. Contact your admin.
        </p>
      )}

      {/* Step 1 — Batches */}
      <MultiSelectDropdown<BatchRecord>
        label="1. Select Batch(es)"
        placeholder="Choose one or more batches…"
        items={batches}
        selected={selectedBatchIds}
        onChange={handleBatchChange}
        isLoading={selectorQuery.isLoading}
        renderItem={(b) =>
          b.start_date
            ? `${b.name} (${b.start_date?.slice(0, 7)} → ${b.end_date?.slice(0, 7) ?? '…'})`
            : b.name
        }
      />

      {/* Step 2 — Teams */}
      <MultiSelectDropdown<TeamRecord>
        label="2. Select Team(s)"
        placeholder={
          selectedBatchIds.size === 0
            ? 'Select a batch first'
            : 'Choose one or more teams…'
        }
        items={teams}
        selected={selectedTeamIds}
        onChange={handleTeamChange}
        disabled={selectedBatchIds.size === 0}
        isLoading={selectorQuery.isLoading}
        renderItem={(t) =>
          showMultipleBatches && t.batch_name
            ? `${t.name} — ${t.batch_name}`
            : t.name
        }
      />

      {/* Step 3 — Users */}
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
          3. Select Users
        </p>

        {selectedTeamIds.size === 0 ? (
          <p className="py-2.5 text-[13px] text-slate-400">
            Select a team to load users.
          </p>
        ) : selectorQuery.isLoading ? (
          <div className="flex items-center gap-2 py-2.5">
            <Spinner size="sm" label="" />
            <span className="text-[13px] text-slate-400">Loading users…</span>
          </div>
        ) : validUsers.length === 0 ? (
          <p className="py-2.5 text-[13px] text-slate-400">
            No users with GitLab usernames found in the selected team(s).
          </p>
        ) : (
          <div className="max-h-[260px] overflow-hidden overflow-y-auto rounded-[10px] border border-slate-200">
            {/* Select all */}
            <label className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-3.5 py-[9px]">
              <input
                type="checkbox"
                checked={
                  selectedUserIds.size === validUsers.length &&
                  validUsers.length > 0
                }
                onChange={() =>
                  setSelectedUserIds(
                    selectedUserIds.size === validUsers.length
                      ? new Set()
                      : new Set(validUsers.map((appUser) => appUser.id))
                  )
                }
                className="accent-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-600">
                Select all ({validUsers.length})
              </span>
            </label>

            {validUsers.map((appUser) => {
              const showTeam = selectedTeamIds.size > 1;
              return (
                <label
                  key={appUser.id}
                  aria-label={appUser.name}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-50 px-3.5 py-[9px] hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(appUser.id)}
                    onChange={() => {
                      const next = new Set(selectedUserIds);
                      if (next.has(appUser.id)) next.delete(appUser.id);
                      else next.add(appUser.id);
                      setSelectedUserIds(next);
                    }}
                    className="accent-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="m-0 truncate text-[13px] font-medium text-slate-800">
                      {appUser.name}
                    </p>
                    <p className="m-0 text-[11px] text-slate-400">
                      @{appUser.gitlab_username}
                      {showTeam && appUser.team_name
                        ? ` · ${appUser.team_name}`
                        : ''}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {selectedUsers.length > 0 && (
          <p className="mt-1.5 text-[11px] text-indigo-500">
            {selectedUsers.length} user
            {selectedUsers.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"
            htmlFor="hs-start-date"
          >
            Start Date
          </label>
          <input
            id="hs-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-[10px] border border-slate-200 px-3 py-[9px] text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"
            htmlFor="hs-end-date"
          >
            End Date
          </label>
          <input
            id="hs-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-[10px] border border-slate-200 px-3 py-[9px] text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Run button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={!canRun}
        className={`flex items-center justify-center gap-2 rounded-[10px] px-6 py-[11px] text-sm font-semibold transition-opacity duration-200 ${
          canRun
            ? 'cursor-pointer bg-gradient-to-br from-indigo-600 to-indigo-500 text-white'
            : 'cursor-not-allowed bg-slate-200 text-slate-400'
        }`}
      >
        {isRunning && <Spinner size="sm" label="" />}
        {isRunning ? 'Running…' : `🚀 ${runLabel}`}
        {!isRunning && selectedUsers.length > 0 && (
          <span className="rounded-full bg-white/20 px-2 py-[1px] text-xs">
            {selectedUsers.length}
          </span>
        )}
      </button>
    </div>
  );
}
