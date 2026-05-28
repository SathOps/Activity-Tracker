import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignMentorBatches,
  getBatches,
  getMembers,
  getMentorBatches,
  removeMentorBatch,
} from '../../api';
import type { MemberRecord } from '../../types';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';

export function MentorAccessPage() {
  const qc = useQueryClient();
  const [selectedMentorId, setSelectedMentorId] = useState<number | ''>('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const membersQuery = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

  const mentorAssignmentsQuery = useQuery({
    queryKey: ['mentor-batches', selectedMentorId],
    queryFn: () => getMentorBatches(Number(selectedMentorId)),
    enabled: !!selectedMentorId,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      assignMentorBatches(Number(selectedMentorId), selectedBatchIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-batches', selectedMentorId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({
      memberId,
      batchId,
    }: {
      memberId: number;
      batchId: number;
    }) => removeMentorBatch(memberId, batchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-batches', selectedMentorId] });
    },
  });

  const mentors = useMemo(
    () =>
      (membersQuery.data ?? []).filter(
        (member: MemberRecord) => member.role === 'mentor'
      ),
    [membersQuery.data]
  );

  useEffect(() => {
    if (mentorAssignmentsQuery.data) {
      setSelectedBatchIds(
        mentorAssignmentsQuery.data.batches.map((batch) => batch.id)
      );
    }
  }, [mentorAssignmentsQuery.data]);

  if (batchesQuery.isLoading || membersQuery.isLoading) {
    return <Spinner label="Loading mentor access…" />;
  }

  if (batchesQuery.isError || membersQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load mentor access data">
        {((batchesQuery.error || membersQuery.error) as Error).message}
      </Alert>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--slate-900)',
          }}
        >
          Select mentor
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Batch scope controls what a mentor can see across members, teams, and
          batches.
        </p>

        <select
          value={selectedMentorId}
          onChange={(event) =>
            setSelectedMentorId(Number(event.target.value) || '')
          }
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Choose a mentor</option>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.name} ({mentor.corpus_username})
            </option>
          ))}
        </select>

        {selectedMentorId ? (
          <div className="mt-5 space-y-3">
            {batchesQuery.data?.map((batch) => {
              const checked = selectedBatchIds.includes(batch.id);
              return (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {batch.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {batch.date || 'No date label'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    aria-label={`Assign ${batch.name} to selected mentor`}
                    onChange={(event) =>
                      setSelectedBatchIds((current) =>
                        event.target.checked
                          ? [...current, batch.id]
                          : current.filter((item) => item !== batch.id)
                      )
                    }
                    className="h-4 w-4"
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void saveMutation.mutate()}
          disabled={!selectedMentorId || saveMutation.isPending}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save mentor access
        </button>
      </div>

      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--slate-900)',
          }}
        >
          Assigned batches
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Remove individual mappings or replace the full set from the left
          panel.
        </p>

        {!selectedMentorId ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Choose a mentor to inspect current batch assignments.
          </div>
        ) : mentorAssignmentsQuery.isLoading ? (
          <div className="mt-6">
            <Spinner label="Loading assignments…" />
          </div>
        ) : mentorAssignmentsQuery.isError ? (
          <div className="mt-6">
            <Alert variant="error">
              {(mentorAssignmentsQuery.error as Error).message}
            </Alert>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {mentorAssignmentsQuery.data?.batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {batch.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {batch.date || 'No date label'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void removeMutation.mutate({
                      memberId: Number(selectedMentorId),
                      batchId: batch.id,
                    })
                  }
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
