import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import { getUserProfile } from '../../api';
import { downloadCsv } from '../../api';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { ProfileHeader } from './ProfileHeader';
import { ProjectsPanel } from './ProjectsPanel';
import { CommitsPanel } from './CommitsPanel';
import { MRsPanel } from './MRsPanel';
import { IssuesPanel } from './IssuesPanel';
import { ProfileReadme } from './ProfileReadme';
import type { UserProfileData } from '../../types';

export function UserProfile() {
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');

  const { data, isLoading, isError, error } = useQuery<UserProfileData>({
    queryKey: ['profile', username],
    queryFn: () => getUserProfile(username),
    enabled: !!username,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  function handleSearch() {
    const u = input.trim();
    if (u) setUsername(u);
  }

  const d = data?.data;

  function handleExport() {
    if (!d) return;
    downloadCsv(d.commits as never, `${username}_commits.csv`);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          👤 User Profile Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fetch comprehensive GitLab activity for any user — projects, commits
          (IST), groups, MRs and issues.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter GitLab username…"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <button
          onClick={handleSearch}
          disabled={!input.trim() || isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Spinner size="sm" label="" /> : <Search size={15} />}
          Search
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" label="" />
          <p className="text-sm text-slate-500">
            Fetching profile data in parallel…
          </p>
          <p className="text-xs text-slate-400">
            This can take 10–30 seconds for active users
          </p>
        </div>
      )}

      {isError && (
        <Alert variant="error" title="Error fetching profile">
          {(error as Error).message}
        </Alert>
      )}

      {data && data.status !== 'Success' && (
        <Alert variant="warning">
          {data.error ?? `User '${username}' data could not be fully loaded.`}
        </Alert>
      )}

      {data?.status === 'Success' && d && (
        <div className="space-y-6">
          {/* Header */}
          <ProfileHeader user={d.user} />

          {/* Export */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={14} /> Export Commits CSV
            </button>
          </div>

          {/* Groups summary */}
          {d.groups.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                👥 Groups ({d.groups.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {d.groups.map((g) => (
                  <span
                    key={g.full_path}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium"
                  >
                    {g.name}
                    <span className="ml-1 text-slate-400">
                      ({g.visibility})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Panels */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ProjectsPanel
              personal={d.projects.personal}
              contributed={d.projects.contributed}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <CommitsPanel stats={d.commit_stats} commits={d.commits} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <MRsPanel stats={d.mr_stats} mrs={d.mrs} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <IssuesPanel stats={d.issue_stats} issues={d.issues} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ProfileReadme readme={d.profile_readme} username={username} />
          </div>
        </div>
      )}
    </div>
  );
}
