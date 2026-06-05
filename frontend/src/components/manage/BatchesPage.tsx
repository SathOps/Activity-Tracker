import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Save, Trash2, X } from 'lucide-react';
import {
  createBatch,
  deleteBatch,
  getBatches,
  updateBatch,
} from '../../services/api/batches';
import { useAuth } from '../../contexts/AuthContext';
import type { BatchRecord } from '../../types';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';

interface BatchDraft {
  name: string;
  start_date: string;
  end_date: string;
}

/* ── Shared glass input style ────────────────────────────── */
const glassInput =
  'w-full rounded-xl px-3 py-2.5 text-sm outline-none ' +
  'bg-white/5 border border-blue-500/20 text-white placeholder:text-white/35 ' +
  'focus:border-blue-500/50 focus:bg-white/8 focus:ring-0 ' +
  'transition-all duration-200 backdrop-blur-sm ' +
  '[color-scheme:dark]'; // makes date picker calendar dark

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

export function BatchesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [draft, setDraft] = useState<BatchDraft>({
    name: '',
    start_date: '',
    end_date: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<BatchDraft>({
    name: '',
    start_date: '',
    end_date: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createBatch(
        draft.name.trim(),
        draft.start_date.trim() || undefined,
        draft.end_date.trim() || undefined
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      setDraft({ name: '', start_date: '', end_date: '' });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (batch: BatchRecord) =>
      updateBatch(batch.id, {
        name: editingDraft.name.trim(),
        start_date: editingDraft.start_date.trim() || undefined,
        end_date: editingDraft.end_date.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (batchId: number) => deleteBatch(batchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });

  const batchCards = useMemo(
    () => batchesQuery.data ?? [],
    [batchesQuery.data]
  );

  if (batchesQuery.isLoading) {
    return <Spinner label="Loading batches…" />;
  }

  if (batchesQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load batches">
        {(batchesQuery.error as Error).message}
      </Alert>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {/* ── Create form (admin only) ───────────────────── */}
      {isAdmin && (
        <div className="flex justify-end z-10 relative">
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="
              h-[38px] px-4 rounded-xl
              text-xs font-semibold whitespace-nowrap
              flex inline-flex items-center gap-1.5
              cursor-pointer transition-all duration-200
              backdrop-blur-md
              bg-blue-600/20 text-blue-300 border border-blue-500/35
              shadow-[0_0_12px_rgba(59,130,246,0.15)]
              hover:bg-blue-500/30 hover:border-blue-500/65 hover:text-blue-100
            "
          >
            {isFormOpen ? (
              <>
                <X size={13} />
                Cancel Create
              </>
            ) : (
              <>
                <Plus size={13} />
                Create Batch
              </>
            )}
          </button>
        </div>
      )}

      {isAdmin && isFormOpen && (
        <div
          className={glassCard}
          style={{
            padding: '22px 26px',
            borderColor: 'rgba(65, 120, 255, 0.35)',
          }}
        >
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: 'rgba(203,213,232,0.6)',
              letterSpacing: '0.01em',
            }}
          >
            Create internship cohorts and define their actual date range
          </p>

          {/* 3 fields + button in one row on desktop, stacked on mobile */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] items-end">
            {/* Batch name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="batch-name"
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(148,163,184,0.8)' }}
              >
                Batch name
              </label>
              <input
                id="batch-name"
                type="text"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Batch 2026"
                className={glassInput}
                style={{ borderColor: 'rgba(65, 120, 255, 0.35)' }}
              />
            </div>

            {/* Start date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="batch-start-date"
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(148,163,184,0.8)' }}
              >
                Start date
              </label>
              <input
                id="batch-start-date"
                type="date"
                value={draft.start_date}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    start_date: event.target.value,
                  }))
                }
                className={glassInput}
                style={{ borderColor: 'rgba(65, 120, 255, 0.35)' }}
              />
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="batch-end-date"
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(148,163,184,0.8)' }}
              >
                End date
              </label>
              <input
                id="batch-end-date"
                type="date"
                value={draft.end_date}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    end_date: event.target.value,
                  }))
                }
                className={glassInput}
                style={{ borderColor: 'rgba(65, 120, 255, 0.35)' }}
              />
            </div>

            {/* Add batch button */}
            <button
              type="button"
              onClick={() => void createMutation.mutate()}
              disabled={!draft.name.trim() || createMutation.isPending}
              className="
                h-[42px] px-[18px] rounded-xl
                text-sm font-semibold whitespace-nowrap
                flex inline-flex items-center justify-center gap-1.5
                cursor-pointer transition-all duration-200
                backdrop-blur-md
                bg-blue-600/20 text-blue-300 border border-blue-500/35
                shadow-[0_0_12px_rgba(59,130,246,0.15)]
                hover:bg-blue-500/30 hover:border-blue-500/65 hover:text-blue-100
                disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/5 disabled:border-blue-500/10 disabled:text-white/30 disabled:shadow-none
                w-full md:w-auto
              "
              style={
                !draft.name.trim() || createMutation.isPending
                  ? { borderColor: 'rgba(65, 120, 255, 0.15)' }
                  : undefined
              }
            >
              <Plus size={14} />
              Add batch
            </button>
          </div>
        </div>
      )}

      {/* ── Batch cards grid ──────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        }}
      >
        {batchCards.map((batch) => {
          const isEditing = editingId === batch.id;

          return (
            <article
              key={batch.id}
              className={glassCard}
              style={{ padding: '20px 24px' }}
            >
              {isEditing ? (
                /* ── Edit form ── */
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editingDraft.name}
                    onChange={(event) =>
                      setEditingDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Batch name"
                    className={glassInput}
                    style={{ borderColor: 'rgba(65, 120, 255, 0.35)' }}
                  />
                  <input
                    type="date"
                    value={editingDraft.start_date}
                    onChange={(event) =>
                      setEditingDraft((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                    className={glassInput}
                    style={{ borderColor: 'rgba(65, 120, 255, 0.35)' }}
                  />
                  <input
                    type="date"
                    value={editingDraft.end_date}
                    onChange={(event) =>
                      setEditingDraft((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                    className={glassInput}
                    style={{ borderColor: 'rgba(65, 120, 255, 0.35)' }}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => void updateMutation.mutate(batch)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Save size={13} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(203,213,232,0.8)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <X size={13} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {batch.name}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: 'rgba(148,163,184,0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Calendar size={11} style={{ flexShrink: 0 }} />
                      {batch.start_date && batch.end_date
                        ? `${batch.start_date} → ${batch.end_date}`
                        : batch.date || 'Date range not set'}
                    </p>
                  </div>

                  {isAdmin ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(batch.id);
                          setEditingDraft({
                            name: batch.name,
                            start_date: batch.start_date || '',
                            end_date: batch.end_date || '',
                          });
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(203,213,232,0.85)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete batch "${batch.name}"?`)) {
                            void deleteMutation.mutate(batch.id);
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(239,68,68,0.25)',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
