/**
 * HierarchicalSelector — Batch → Team → User cascading multi-select.
 *
 * Used by Leaderboard, Batch Analytics, and Weekly Performance pages.
 * Backend filters results by the caller's role automatically (admin sees all,
 * mentor sees only their assigned batches/teams/users).
 */

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
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => !disabled && setOpen((o) => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '9px 14px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: disabled ? '#f8fafc' : '#fff',
            color: selectedCount === 0 ? '#94a3b8' : '#1e293b',
            fontSize: 13,
            fontWeight: selectedCount > 0 ? 500 : 400,
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? 'Loading…' : triggerLabel}
          </span>
          {isLoading ? (
            <Spinner size="sm" label="" />
          ) : (
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
              {open ? '▲' : '▾'}
            </span>
          )}
        </button>

        {open && !disabled && items.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              zIndex: 50,
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {/* Select all */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderBottom: '1px solid #f1f5f9',
                cursor: 'pointer',
                background: '#f8fafc',
              }}
            >
              <input
                type="checkbox"
                checked={selectedCount === items.length && items.length > 0}
                onChange={toggleAll}
                style={{ accentColor: '#6366f1' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Select all ({items.length})
              </span>
            </label>

            {items.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  borderBottom: '1px solid #f8fafc',
                  cursor: 'pointer',
                }}
                className="hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(item.id)}
                  style={{ accentColor: '#6366f1' }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: '#1e293b',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {renderItem ? renderItem(item) : item.name}
                </span>
              </label>
            ))}
          </div>
        )}

        {open && !disabled && !isLoading && items.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              zIndex: 50,
              padding: '12px 14px',
              fontSize: 13,
              color: '#94a3b8',
            }}
          >
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
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {/* Empty state for no batches */}
      {!selectorQuery.isLoading && batches.length === 0 && (
        <p
          style={{
            fontSize: 13,
            color: '#94a3b8',
            textAlign: 'center',
            padding: '12px 0',
          }}
        >
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
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          3. Select Users
        </p>

        {selectedTeamIds.size === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', padding: '10px 0' }}>
            Select a team to load users.
          </p>
        ) : selectorQuery.isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 0',
            }}
          >
            <Spinner size="sm" label="" />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              Loading users…
            </span>
          </div>
        ) : validUsers.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', padding: '10px 0' }}>
            No users with GitLab usernames found in the selected team(s).
          </p>
        ) : (
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              overflow: 'hidden',
              maxHeight: 260,
              overflowY: 'auto',
            }}
          >
            {/* Select all */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderBottom: '1px solid #f1f5f9',
                cursor: 'pointer',
                background: '#f8fafc',
              }}
            >
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
                style={{ accentColor: '#6366f1' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Select all ({validUsers.length})
              </span>
            </label>

            {validUsers.map((appUser) => {
              const showTeam = selectedTeamIds.size > 1;
              return (
                <label
                  key={appUser.id}
                  aria-label={appUser.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: '1px solid #f8fafc',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-slate-50"
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
                    style={{ accentColor: '#6366f1' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1e293b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {appUser.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
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
          <p style={{ marginTop: 6, fontSize: 11, color: '#6366f1' }}>
            {selectedUsers.length} user
            {selectedUsers.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Date range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}
            htmlFor="hs-start-date"
          >
            Start Date
          </label>
          <input
            id="hs-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '9px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}
            htmlFor="hs-end-date"
          >
            End Date
          </label>
          <input
            id="hs-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: '9px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Run button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={!canRun}
        style={{
          padding: '11px 24px',
          borderRadius: 10,
          border: 'none',
          background: canRun
            ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
            : '#e2e8f0',
          color: canRun ? '#fff' : '#94a3b8',
          fontSize: 14,
          fontWeight: 600,
          cursor: canRun ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'opacity 0.2s',
        }}
      >
        {isRunning && <Spinner size="sm" label="" />}
        {isRunning ? 'Running…' : `🚀 ${runLabel}`}
        {!isRunning && selectedUsers.length > 0 && (
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 99,
              padding: '1px 8px',
              fontSize: 12,
            }}
          >
            {selectedUsers.length}
          </span>
        )}
      </button>
    </div>
  );
}
