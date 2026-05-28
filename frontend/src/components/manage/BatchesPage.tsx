import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { createBatch, deleteBatch, getBatches, updateBatch } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { BatchRecord } from '../../types';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';

interface BatchDraft {
  name: string;
  start_date: string;
  end_date: string;
}

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
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ marginBottom: isAdmin ? 20 : 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Batch management
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 14,
              color: 'var(--slate-500)',
            }}
          >
            {isAdmin
              ? 'Create internship cohorts and define their actual date range.'
              : 'Review the batches currently assigned to your mentor scope.'}
          </p>
        </div>

        {isAdmin ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <input
              type="text"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Batch name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={draft.start_date}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  start_date: event.target.value,
                }))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={draft.end_date}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  end_date: event.target.value,
                }))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void createMutation.mutate()}
              disabled={!draft.name.trim() || createMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Plus size={14} />
              Add batch
            </button>
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        }}
      >
        {batchCards.map((batch) => {
          const isEditing = editingId === batch.id;

          return (
            <article
              key={batch.id}
              className="glass-card"
              style={{ padding: '24px 28px' }}
            >
              {isEditing ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <input
                    type="text"
                    value={editingDraft.name}
                    onChange={(event) =>
                      setEditingDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => void updateMutation.mutate(batch)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                        {batch.name}
                      </h3>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 14,
                          color: 'var(--slate-500)',
                        }}
                      >
                        {batch.start_date && batch.end_date
                          ? `${batch.start_date} to ${batch.end_date}`
                          : batch.date || 'Date range not set'}
                      </p>
                    </div>
                    {isAdmin ? (
                      <div style={{ display: 'flex', gap: 8 }}>
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
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(`Delete batch "${batch.name}"?`)
                            ) {
                              void deleteMutation.mutate(batch.id);
                            }
                          }}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      marginTop: 18,
                    }}
                  >
                    <div className="rounded-lg bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Teams</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {batch.team_count}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">Members</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {batch.member_count}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
