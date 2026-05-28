/**
 * HierarchicalSelector — Batch → Team → Member cascading multi-select.
 *
 * Used by Leaderboard, Batch Analytics, and Weekly Performance pages.
 * Backend filters results by the caller's role automatically (admin sees all,
 * mentor sees only their assigned batches/teams/members).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBatches, getTeamsByBatchIds, getMembersByTeamIds } from '../../api';
import type { BatchRecord, MemberRecord, TeamRecord } from '../../types';
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
  members: SelectedMember[];
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
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(
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

  // Step 1 — Batches (load on mount)
  const batchesQuery = useQuery<BatchRecord[]>({
    queryKey: ['batches'],
    queryFn: getBatches,
    staleTime: 5 * 60 * 1000,
  });

  // Step 2 — Teams (load when batches are selected)
  const batchIdList = useMemo(
    () => Array.from(selectedBatchIds).sort((a, b) => a - b),
    [selectedBatchIds]
  );
  const teamsQuery = useQuery<TeamRecord[]>({
    queryKey: ['teams-by-batch', batchIdList],
    queryFn: () => getTeamsByBatchIds(batchIdList),
    enabled: batchIdList.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Step 3 — Members: one fetch per selected team, merged together.
  // Using plain useEffect instead of useQuery because the custom query shim
  // does not re-trigger when only the query key changes.
  const teamIdList = useMemo(
    () => Array.from(selectedTeamIds).sort((a, b) => a - b),
    [selectedTeamIds]
  );
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (teamIdList.length === 0) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    setMembersLoading(true);
    Promise.all(teamIdList.map((id) => getMembersByTeamIds([id])))
      .then((results) => {
        if (!cancelled) {
          setMembers(results.flat());
          setMembersLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teamIdList]);

  const teams = teamsQuery.data ?? [];

  // Clear downstream selections on upstream change
  function handleBatchChange(next: Set<number>) {
    setSelectedBatchIds(next);
    setSelectedTeamIds(new Set());
    setSelectedMemberIds(new Set());
  }

  function handleTeamChange(next: Set<number>) {
    setSelectedTeamIds(next);
    setSelectedMemberIds(new Set());
  }

  // Collect valid (has gitlab_username) selected members
  const validMembers = members.filter((m) => !!m.gitlab_username?.trim());
  const selectedMembers = validMembers.filter((m) =>
    selectedMemberIds.has(m.id)
  );

  const showMultipleBatches = selectedBatchIds.size > 1;

  function handleRun() {
    const output: SelectorOutput = {
      members: selectedMembers.map((m) => ({
        id: m.id,
        name: m.name,
        corpus_username: m.corpus_username,
        gitlab_username: m.gitlab_username!.trim(),
        team_id: m.team_id ?? 0,
        team_name: m.team_name ?? '',
        batch_name: m.batch_name ?? '',
      })),
      startDate,
      endDate,
    };
    onRun(output);
  }

  const canRun =
    selectedMembers.length > 0 && !!startDate && !!endDate && !isRunning;

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
      {!batchesQuery.isLoading && (batchesQuery.data ?? []).length === 0 && (
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
        items={batchesQuery.data ?? []}
        selected={selectedBatchIds}
        onChange={handleBatchChange}
        isLoading={batchesQuery.isLoading}
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
        isLoading={teamsQuery.isLoading}
        renderItem={(t) =>
          showMultipleBatches && t.batch_name
            ? `${t.name} — ${t.batch_name}`
            : t.name
        }
      />

      {/* Step 3 — Members */}
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
          3. Select Members
        </p>

        {selectedTeamIds.size === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', padding: '10px 0' }}>
            Select a team to load members.
          </p>
        ) : membersLoading ? (
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
              Loading members…
            </span>
          </div>
        ) : validMembers.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', padding: '10px 0' }}>
            No members with GitLab usernames found in the selected team(s).
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
                  selectedMemberIds.size === validMembers.length &&
                  validMembers.length > 0
                }
                onChange={() =>
                  setSelectedMemberIds(
                    selectedMemberIds.size === validMembers.length
                      ? new Set()
                      : new Set(validMembers.map((m) => m.id))
                  )
                }
                style={{ accentColor: '#6366f1' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Select all ({validMembers.length})
              </span>
            </label>

            {validMembers.map((member) => {
              const showTeam = selectedTeamIds.size > 1;
              return (
                <label
                  key={member.id}
                  aria-label={member.name}
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
                    checked={selectedMemberIds.has(member.id)}
                    onChange={() => {
                      const next = new Set(selectedMemberIds);
                      if (next.has(member.id)) next.delete(member.id);
                      else next.add(member.id);
                      setSelectedMemberIds(next);
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
                      {member.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                      @{member.gitlab_username}
                      {showTeam && member.team_name
                        ? ` · ${member.team_name}`
                        : ''}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {selectedMembers.length > 0 && (
          <p style={{ marginTop: 6, fontSize: 11, color: '#6366f1' }}>
            {selectedMembers.length} member
            {selectedMembers.length > 1 ? 's' : ''} selected
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
        {!isRunning && selectedMembers.length > 0 && (
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 99,
              padding: '1px 8px',
              fontSize: 12,
            }}
          >
            {selectedMembers.length}
          </span>
        )}
      </button>
    </div>
  );
}
