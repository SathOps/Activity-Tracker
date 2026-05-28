import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import {
  getUserProfile,
  getUserCommits,
  downloadCsv,
  getGitlabAuthorizeUrl,
} from '../../api';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { ProfileHeader } from './ProfileHeader';
import { ProjectsPanel } from './ProjectsPanel';
import { CommitsPanel } from './CommitsPanel';
import { MRsPanel } from './MRsPanel';
import { IssuesPanel } from './IssuesPanel';
import { ProfileReadme } from './ProfileReadme';
import type { UserProfileData, UserCommitsResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

function isGitlabSessionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return (
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('gitlab api error')
  );
}

export function UserProfile() {
  const { user, recheckGitlab } = useAuth();
  const isIntern = user?.role === 'intern';

  const internUsername = user?.gitlabUsername ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [queriedUsername, setQueriedUsername] = useState(
    isIntern ? internUsername : ''
  );

  const appliedRef = useRef(false);
  useEffect(() => {
    if (isIntern && internUsername && !appliedRef.current) {
      appliedRef.current = true;
      setQueriedUsername(internUsername);
    }
  }, [isIntern, internUsername]);

  // ── Profile fetch (projects, MRs, issues, groups, readme) ────────────────
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileIsError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<UserProfileData>({
    queryKey: ['gitlab-profile', queriedUsername],
    queryFn: () => getUserProfile(queriedUsername),
    enabled: !!queriedUsername,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  // ── Commits fetch — runs in parallel, may resolve later ──────────────────
  const {
    data: commitsData,
    isLoading: commitsLoading,
    isError: commitsIsError,
  } = useQuery<UserCommitsResponse>({
    queryKey: ['gitlab-commits', queriedUsername],
    queryFn: () => getUserCommits(queriedUsername),
    // Only start when the profile query is enabled (username known)
    enabled: !!queriedUsername,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  function handleSearch() {
    const u = searchInput.trim();
    if (u) setQueriedUsername(u);
  }

  const d = profileData?.data;
  const profileOk = profileData?.status?.toLowerCase() === 'success' && !!d;

  function handleExport() {
    if (!commitsData?.commits) return;
    downloadCsv(commitsData.commits as never, `${queriedUsername}_commits.csv`);
  }

  return (
    <div>
      {/* Search bar — admin / mentor only */}
      {!isIntern && (
        <div className="mb-6 flex gap-3">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter GitLab username…"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={!searchInput.trim() || profileLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {profileLoading ? (
              <Spinner size="sm" label="" />
            ) : (
              <Search size={15} />
            )}
            Search
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isIntern && !queriedUsername && !profileLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
          <Search size={36} />
          <p className="text-sm">
            Enter a GitLab username above to load their profile.
          </p>
        </div>
      )}

      {/* Intern with no gitlab_username */}
      {isIntern && !internUsername && !profileLoading && (
        <Alert variant="warning" title="GitLab account not linked">
          Your GitLab username is not set. Go to{' '}
          <strong>My Profile → Edit Profile</strong> to add it.
        </Alert>
      )}

      {/* Profile loading spinner */}
      {profileLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" label="" />
          <p className="text-sm text-slate-500">Fetching profile data…</p>
          <p className="text-xs text-slate-400">
            Usually completes in 3–5 seconds
          </p>
        </div>
      )}

      {/* GitLab session error */}
      {profileIsError &&
        (isGitlabSessionError(profileError) ? (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 12,
              background: '#fef3c7',
              border: '1px solid #fcd34d',
            }}
          >
            <p
              style={{
                margin: '0 0 4px',
                fontWeight: 700,
                color: '#92400e',
                fontSize: 14,
              }}
            >
              GitLab session expired
            </p>
            <p style={{ margin: '0 0 14px', color: '#78350f', fontSize: 13 }}>
              Your GitLab access token has expired or the session is invalid.
              Reconnect to continue.
            </p>
            <button
              type="button"
              onClick={() => {
                recheckGitlab();
                window.location.href = getGitlabAuthorizeUrl();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reconnect GitLab
            </button>
          </div>
        ) : (
          <Alert variant="error" title="Error fetching profile">
            {(profileError as Error).message}
            <button
              type="button"
              onClick={() => void refetchProfile()}
              className="ml-3 underline text-sm"
            >
              Retry
            </button>
          </Alert>
        ))}

      {/* Backend returned non-success status */}
      {!profileLoading &&
        profileData &&
        profileData.status?.toLowerCase() !== 'success' && (
          <Alert
            variant="warning"
            title={`Profile fetch failed (status: ${profileData.status ?? 'unknown'})`}
          >
            {profileData.error
              ? `Backend error: ${profileData.error}`
              : `Profile for '@${queriedUsername}' could not be loaded.`}
          </Alert>
        )}

      {/* ── Profile data ───────────────────────────────────────────────────── */}
      {!profileLoading && profileOk && (
        <div className="space-y-6">
          <ProfileHeader user={d.user} />

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing activity for{' '}
              <strong className="text-slate-600">@{queriedUsername}</strong>
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={!commitsData?.commits}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              <Download size={14} /> Export Commits CSV
            </button>
          </div>

          {/* Groups */}
          {d.groups.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Groups ({d.groups.length})
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

          {/* Projects */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ProjectsPanel
              personal={d.projects.personal}
              contributed={d.projects.contributed}
            />
          </div>

          {/* Commits — separate loading state, arrives after profile */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {commitsLoading ? (
              <div className="flex items-center gap-3 py-6">
                <Spinner size="sm" label="" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Loading commits…
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This can take 10–30 seconds for active users
                  </p>
                </div>
              </div>
            ) : commitsIsError ? (
              <p className="text-sm text-red-500 py-4">
                Could not load commits. Profile data is still available above.
              </p>
            ) : (
              <CommitsPanel
                stats={
                  commitsData?.commit_stats ?? {
                    total: 0,
                    morning_commits: 0,
                    afternoon_commits: 0,
                  }
                }
                commits={commitsData?.commits ?? []}
              />
            )}
          </div>

          {/* MRs */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <MRsPanel stats={d.mr_stats} mrs={d.mrs} />
          </div>

          {/* Issues */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <IssuesPanel stats={d.issue_stats} issues={d.issues} />
          </div>

          {/* Profile README */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ProfileReadme
              readme={d.profile_readme}
              username={queriedUsername}
            />
          </div>
        </div>
      )}
    </div>
  );
}
