import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMentorGroupMember,
  createMentorGroup,
  deleteMentorGroup,
  getBatches,
  getMembers,
  getMentorGroupMembers,
  getMentorGroups,
  removeMentorGroupMember,
} from '../../api';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { useMentorGroupStore } from '../../stores/mentorGroupStore';

export function MentorGroupsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const activeGroup = useMentorGroupStore((state) => state.activeGroup);
  const setActiveGroup = useMentorGroupStore((state) => state.setActiveGroup);
  const [newGroupName, setNewGroupName] = useState('');
  const [mentorId, setMentorId] = useState<number | ''>(
    user?.role === 'mentor' ? user.id : ''
  );
  const [batchId, setBatchId] = useState<number | ''>('');
  const [internQuery, setInternQuery] = useState('');

  useEffect(() => {
    if (user?.role === 'mentor') {
      setMentorId(user.id);
    }
  }, [user?.id, user?.role]);

  const groupsQuery = useQuery({
    queryKey: ['mentor-groups'],
    queryFn: getMentorGroups,
  });
  const membersQuery = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });
  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const selectedGroupId = activeGroup?.id ?? null;

  useEffect(() => {
    const groups = groupsQuery.data ?? [];
    if (!groups.length) {
      if (activeGroup) {
        setActiveGroup(null);
      }
      return;
    }

    const matchingGroup = selectedGroupId
      ? groups.find((group) => group.id === selectedGroupId)
      : null;

    if (matchingGroup) {
      if (activeGroup?.name !== matchingGroup.name) {
        setActiveGroup({ id: matchingGroup.id, name: matchingGroup.name });
      }
      return;
    }

    if (user?.role === 'mentor') {
      setActiveGroup({ id: groups[0].id, name: groups[0].name });
    }
  }, [
    activeGroup,
    groupsQuery.data,
    selectedGroupId,
    setActiveGroup,
    user?.role,
  ]);

  const groupMembersQuery = useQuery({
    queryKey: ['mentor-group-members', selectedGroupId],
    queryFn: () => getMentorGroupMembers(selectedGroupId as number),
    enabled: selectedGroupId !== null,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createMentorGroup({
        name: newGroupName.trim(),
        mentor_id: user?.role === 'mentor' ? user.id : Number(mentorId),
        batch_id: batchId ? Number(batchId) : undefined,
      }),
    onSuccess: (group) => {
      qc.invalidateQueries({ queryKey: ['mentor-groups'] });
      setNewGroupName('');
      if (user?.role !== 'mentor') {
        setMentorId('');
      }
      setBatchId('');
      setActiveGroup({ id: group.id, name: group.name });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      addMentorGroupMember(selectedGroupId as number, userId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['mentor-group-members', selectedGroupId],
      });
      qc.invalidateQueries({ queryKey: ['mentor-groups'] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      removeMentorGroupMember(selectedGroupId as number, userId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['mentor-group-members', selectedGroupId],
      });
      qc.invalidateQueries({ queryKey: ['mentor-groups'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: number) => deleteMentorGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-groups'] });
      setActiveGroup(null);
    },
  });

  const mentors = useMemo(
    () =>
      (membersQuery.data ?? []).filter((member) => member.role === 'mentor'),
    [membersQuery.data]
  );
  const interns = useMemo(
    () =>
      (membersQuery.data ?? []).filter((member) => member.role === 'intern'),
    [membersQuery.data]
  );
  const filteredInterns = useMemo(() => {
    const query = internQuery.trim().toLowerCase();
    if (!query) {
      return interns;
    }
    return interns.filter(
      (intern) =>
        intern.name.toLowerCase().includes(query) ||
        intern.corpus_username.toLowerCase().includes(query) ||
        (intern.team_name || '').toLowerCase().includes(query) ||
        (intern.gitlab_username || '').toLowerCase().includes(query)
    );
  }, [internQuery, interns]);
  const selectedGroup =
    groupsQuery.data?.find((group) => group.id === selectedGroupId) ?? null;
  const selectedGroupMemberIds = useMemo(
    () => new Set((groupMembersQuery.data ?? []).map((member) => member.id)),
    [groupMembersQuery.data]
  );

  if (
    groupsQuery.isLoading ||
    membersQuery.isLoading ||
    batchesQuery.isLoading
  ) {
    return <Spinner label="Loading mentor groups…" />;
  }

  if (groupsQuery.isError || membersQuery.isError || batchesQuery.isError) {
    return (
      <Alert variant="error" title="Failed to load mentor groups">
        {
          (
            (groupsQuery.error ||
              membersQuery.error ||
              batchesQuery.error) as Error
          ).message
        }
      </Alert>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Mentor groups
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Create app-DB backed intern groups used for scoped standup and
          compliance tracking.
        </p>
        <div className="mt-5 space-y-3">
          <input
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {user?.role === 'mentor' ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Group owner:{' '}
              <span className="font-medium text-slate-900">{user.name}</span>
            </div>
          ) : (
            <select
              value={mentorId}
              onChange={(event) =>
                setMentorId(Number(event.target.value) || '')
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select mentor</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={batchId}
            onChange={(event) => setBatchId(Number(event.target.value) || '')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Optional batch scope</option>
            {batchesQuery.data?.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void createMutation.mutate()}
            disabled={
              !newGroupName.trim() ||
              (!(user?.role === 'mentor') && !mentorId) ||
              createMutation.isPending
            }
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create group
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {groupsQuery.data?.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroup({ id: group.id, name: group.name })}
              className={`w-full rounded-lg border px-4 py-3 text-left ${
                selectedGroupId === group.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{group.name}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {group.mentor_name} · {group.member_count} member(s)
                  </p>
                </div>
                <span className="text-xs">
                  {group.batch_name || 'No batch'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Group members
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add interns from the app database into the selected mentor group.
            </p>
          </div>
          {selectedGroupId ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this mentor group?')) {
                  void deleteMutation.mutate(selectedGroupId);
                }
              }}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
            >
              Delete group
            </button>
          ) : null}
        </div>

        {!selectedGroupId ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            Select a mentor group to manage its interns.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Selected group:
                <span className="ml-1 font-medium text-slate-900">
                  {selectedGroup?.name || 'Unknown group'}
                </span>
              </div>
              <input
                value={internQuery}
                onChange={(event) => setInternQuery(event.target.value)}
                placeholder="Search interns from app DB by name, username, team, or GitLab handle"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            {groupMembersQuery.isLoading ? (
              <div className="mt-6">
                <Spinner label="Loading group members…" />
              </div>
            ) : groupMembersQuery.isError ? (
              <div className="mt-6">
                <Alert variant="error">
                  {(groupMembersQuery.error as Error).message}
                </Alert>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                  Showing interns already registered in this app database.
                  Corpus search is not used here.
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Active group members:{' '}
                  <span className="font-semibold text-slate-900">
                    {groupMembersQuery.data?.length ?? 0}
                  </span>
                </div>
                <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  {filteredInterns.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                      No interns matched your search.
                    </div>
                  ) : null}
                  {filteredInterns.map((intern) => {
                    const isInGroup = selectedGroupMemberIds.has(intern.id);
                    const isPending =
                      addMemberMutation.isPending ||
                      removeMemberMutation.isPending;
                    return (
                      <div
                        key={intern.id}
                        className={`rounded-xl border px-4 py-3 ${
                          isInGroup
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {intern.name}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  isInGroup
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isInGroup ? 'In group' : 'Available'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {intern.corpus_username}
                              {intern.team_name ? ` · ${intern.team_name}` : ''}
                              {intern.gitlab_username
                                ? ` · GitLab: ${intern.gitlab_username}`
                                : ' · GitLab not linked'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              isInGroup
                                ? void removeMemberMutation.mutate(intern.id)
                                : void addMemberMutation.mutate(intern.id)
                            }
                            disabled={isPending}
                            className={`rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                              isInGroup
                                ? 'border border-red-200 text-red-600'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isInGroup ? 'Remove' : 'Add to group'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
