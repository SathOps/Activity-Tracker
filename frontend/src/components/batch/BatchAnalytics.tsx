import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Upload, RotateCcw, FolderSearch } from 'lucide-react';
import { useBatchStream } from '../../hooks/useBatchStream';
import { getMentorGroupMembers, resolveProjects } from '../../api';
import { Alert } from '../ui/Alert';
import { Accordion } from '../ui/Accordion';
import { BatchProgress } from './BatchProgress';
import { BatchTable } from './BatchTable';
import type { BatchUserRow } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useMentorGroupStore } from '../../stores/mentorGroupStore';
import { useRouter } from '../../lib/router';
import { Spinner } from '../ui/Spinner';

export function BatchAnalytics() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const activeGroup = useMentorGroupStore((state) => state.activeGroup);
  const [usernameText, setUsernameText] = useState('');
  const [repoText, setRepoText] = useState('');
  const [fileUsernames, setFileUsernames] = useState<string[]>([]);
  const [repoError, setRepoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const stream = useBatchStream();
  const isMentor = user?.role === 'mentor';

  const mentorGroupMembersQuery = useQuery({
    queryKey: ['mentor-group-members', activeGroup?.id],
    queryFn: () => getMentorGroupMembers(activeGroup?.id as number),
    enabled: isMentor && !!activeGroup?.id,
  });

  const mentorMembers = mentorGroupMembersQuery.data;
  const mentorUsernames = useMemo(
    () => [
      ...new Set(
        (mentorMembers ?? [])
          .map((member) => member.gitlab_username?.trim())
          .filter((username): username is string => Boolean(username))
      ),
    ],
    [mentorMembers]
  );
  const missingGitlabMembers = useMemo(
    () =>
      (mentorMembers ?? []).filter((member) => !member.gitlab_username?.trim()),
    [mentorMembers]
  );

  function collectUsernames(): string[] {
    if (isMentor) {
      return mentorUsernames;
    }

    const fromText = usernameText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    return [...new Set([...fromText, ...fileUsernames])];
  }

  async function handleRun() {
    const usernames = collectUsernames();
    if (!usernames.length) {
      return;
    }

    stream.reset();
    setRepoError('');

    const repoPaths = repoText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    if (repoPaths.length) {
      const result = await resolveProjects(repoPaths);
      if (result.failed.length) {
        setRepoError(`Could not resolve: ${result.failed.join(', ')}`);
      }
      stream.start(
        usernames,
        result.resolved.length ? result.resolved : undefined
      );
    } else {
      stream.start(usernames);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result =
        typeof ev.target?.result === 'string' ? ev.target.result : '';
      const lines = result
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      setFileUsernames(lines);
    };
    reader.readAsText(file);
  }

  const allUsernames = collectUsernames();
  const finalRows = stream.results
    .filter((r) => r.username)
    .map((r) => r as unknown as BatchUserRow);
  const mentorNeedsGroup = isMentor && !activeGroup?.id;
  const mentorHasNoGitlabUsers =
    isMentor &&
    !!activeGroup?.id &&
    !mentorGroupMembersQuery.isLoading &&
    mentorUsernames.length === 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">📊 Batch Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Comprehensive report: General Stats + Authored Issue Quality +
          Authored MR Quality. Results stream in live as each user completes.
        </p>
      </div>

      <Accordion title="🛠️ Configuration" defaultOpen>
        <div className="space-y-4 pt-2">
          {isMentor ? (
            mentorNeedsGroup ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">
                  Select an active mentor group before running batch analytics.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/compliance/mentor-groups')}
                  className="mt-3 text-sm font-medium text-brand-600 hover:underline"
                >
                  Go to Mentor Groups
                </button>
              </div>
            ) : mentorGroupMembersQuery.isLoading ? (
              <Spinner label="Loading active mentor group…" />
            ) : (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
                <p className="font-semibold">
                  Active mentor group: {activeGroup?.name}
                </p>
                <p className="mt-1 text-blue-800">
                  Monitoring {mentorUsernames.length} GitLab-linked intern(s)
                  from {(mentorMembers ?? []).length} total group member(s).
                </p>
                {missingGitlabMembers.length > 0 ? (
                  <p className="mt-2 text-xs text-blue-700">
                    Skipped due to missing GitLab usernames:{' '}
                    {missingGitlabMembers
                      .map((member) => member.name)
                      .join(', ')}
                  </p>
                ) : null}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                  htmlFor="batch-usernames"
                >
                  ⌨️ Enter Usernames (one per line)
                </label>
                <textarea
                  id="batch-usernames"
                  value={usernameText}
                  onChange={(e) => setUsernameText(e.target.value)}
                  placeholder={'user1\nuser2\nuser3'}
                  rows={6}
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                  htmlFor="batch-file"
                >
                  📂 Upload Usernames (.txt)
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <Upload size={20} className="mb-1 text-slate-300" />
                  <p className="text-xs text-slate-400">
                    Click to upload .txt file
                  </p>
                  {fileUsernames.length > 0 && (
                    <p className="mt-1 text-xs font-medium text-brand-600">
                      {fileUsernames.length} users loaded
                    </p>
                  )}
                </button>
                <input
                  id="batch-file"
                  ref={fileRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-slate-600"
              htmlFor="batch-repos"
            >
              <FolderSearch size={12} className="mr-1 inline" />
              Filter by Project Repos{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="batch-repos"
              value={repoText}
              onChange={(e) => {
                setRepoText(e.target.value);
                setRepoError('');
              }}
              placeholder={
                'tools/gitlab-compliance-checker\ngroup/another-repo'
              }
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            {repoError && (
              <p className="mt-1 text-xs text-amber-600">⚠️ {repoError}</p>
            )}
          </div>
        </div>
      </Accordion>

      <div className="my-4 flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={
            stream.isRunning ||
            allUsernames.length === 0 ||
            mentorNeedsGroup ||
            mentorHasNoGitlabUsers
          }
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          <Play size={15} />🚀 Run Unified Analysis
          {allUsernames.length > 0 && (
            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs">
              {allUsernames.length}
            </span>
          )}
        </button>
        {(stream.results.length > 0 || stream.error) && (
          <button
            onClick={stream.reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
      </div>

      {stream.error && (
        <Alert variant="error" className="mb-4">
          {stream.error}
        </Alert>
      )}

      {stream.isRunning && (
        <div className="mb-4">
          <BatchProgress
            progress={stream.progress}
            current={Math.round(stream.progress * stream.total)}
            total={stream.total}
            results={stream.results}
          />
        </div>
      )}

      {finalRows.length > 0 && !stream.isRunning && (
        <BatchTable rows={finalRows} />
      )}

      {finalRows.length > 0 && stream.isRunning && (
        <div className="pointer-events-none opacity-60">
          <BatchTable rows={finalRows} />
        </div>
      )}
    </div>
  );
}
