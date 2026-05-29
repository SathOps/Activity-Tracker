import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import {
  getUserProfile,
  getUserCommits,
  searchMembers,
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
import type {
  MemberRecord,
  UserProfileData,
  UserCommitsResponse,
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';

function isGitlabSessionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return (
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('gitlab api error')
  );
}

// ── Member search dropdown (admin / mentor only) ──────────────────────────────

function MemberSearchBox({
  onSelect,
}: {
  onSelect: (gitlabUsername: string, displayName: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: wait 300 ms after the user stops typing before searching
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const { data: results, isLoading } = useQuery<MemberRecord[]>({
    queryKey: ['member-search', debouncedQuery],
    queryFn: () => searchMembers(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    retry: false,
    staleTime: 30 * 1000,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(member: MemberRecord) {
    if (!member.gitlab_username?.trim()) return;
    setQuery(member.name || member.corpus_username);
    setOpen(false);
    onSelect(
      member.gitlab_username.trim(),
      member.name || member.corpus_username
    );
  }

  const showDropdown = open && debouncedQuery.length >= 1;

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      <div className="flex gap-3">
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or corpus username…"
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {isLoading && (
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <Spinner size="sm" label="" />
            </span>
          )}
        </div>
      </div>

      {showDropdown && (results ?? []).length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 50,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {results!.map((member) => {
            const hasGitlab = !!member.gitlab_username?.trim();
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelect(member)}
                disabled={!hasGitlab}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: hasGitlab ? 'pointer' : 'not-allowed',
                  opacity: hasGitlab ? 1 : 0.45,
                  textAlign: 'left',
                }}
                className="hover:bg-slate-50"
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {(member.name || member.corpus_username)[0]?.toUpperCase() ??
                    '?'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {member.name || member.corpus_username}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                    @{member.corpus_username}
                    {member.gitlab_username
                      ? ` · GitLab: ${member.gitlab_username}`
                      : ' · No GitLab username'}
                  </p>
                </div>

                {/* Role badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: 99,
                    background:
                      member.role === 'admin'
                        ? '#fee2e2'
                        : member.role === 'mentor'
                          ? '#dbeafe'
                          : '#d1fae5',
                    color:
                      member.role === 'admin'
                        ? '#991b1b'
                        : member.role === 'mentor'
                          ? '#1e40af'
                          : '#065f46',
                    flexShrink: 0,
                  }}
                >
                  {member.role ?? 'intern'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showDropdown &&
        !isLoading &&
        debouncedQuery.length >= 1 &&
        (results ?? []).length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              zIndex: 50,
              padding: '12px 16px',
              fontSize: 13,
              color: '#94a3b8',
            }}
          >
            No members found for &quot;{debouncedQuery}&quot;
          </div>
        )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UserProfile() {
  const { user, recheckGitlab } = useAuth();
  const isIntern = user?.role === 'intern';

  const internUsername = user?.gitlabUsername ?? '';
  const [queriedUsername, setQueriedUsername] = useState(
    isIntern ? internUsername : ''
  );
  const [selectedName, setSelectedName] = useState('');

  const appliedRef = useRef(false);
  useEffect(() => {
    if (isIntern && internUsername && !appliedRef.current) {
      appliedRef.current = true;
      setQueriedUsername(internUsername);
    }
  }, [isIntern, internUsername]);

  // ── Profile fetch ─────────────────────────────────────────────────────────
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

  // ── Commits fetch — parallel, arrives later ───────────────────────────────
  const {
    data: commitsData,
    isLoading: commitsLoading,
    isError: commitsIsError,
  } = useQuery<UserCommitsResponse>({
    queryKey: ['gitlab-commits', queriedUsername],
    queryFn: () => getUserCommits(queriedUsername),
    enabled: !!queriedUsername,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const d = profileData?.data;
  const profileOk = profileData?.status?.toLowerCase() === 'success' && !!d;

  function handleExport() {
    if (!commitsData?.commits) return;
    downloadCsv(commitsData.commits as never, `${queriedUsername}_commits.csv`);
  }

  return (
    <div>
      {/* Search — admin / mentor: member search dropdown */}
      {!isIntern && (
        <div className="mb-6">
          <MemberSearchBox
            onSelect={(gitlabUsername, name) => {
              setSelectedName(name);
              setQueriedUsername(gitlabUsername);
            }}
          />
          {queriedUsername && selectedName && (
            <p className="mt-2 text-xs text-slate-400">
              Showing GitLab profile for{' '}
              <strong className="text-slate-600">{selectedName}</strong> ·{' '}
              <span className="font-mono text-indigo-500">
                @{queriedUsername}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isIntern && !queriedUsername && !profileLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
          <Search size={36} />
          <p className="text-sm">
            Search a member above to load their GitLab profile.
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

      {/* Profile loading */}
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

      {/* Backend non-success */}
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

      {/* ── Profile data ─────────────────────────────────────────────────── */}
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

          {/* Commits */}
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
