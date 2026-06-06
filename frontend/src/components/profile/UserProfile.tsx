import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import { getGitlabLoginUrl } from '../../services/api/auth';
import { getUserComplianceDetail } from '../../services/api/compliance';
import { searchUsers } from '../../services/api/users';
import { downloadCsv } from '../../services/api/upload';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { ProfileHeader } from './ProfileHeader';
import { ProjectsPanel } from './ProjectsPanel';
import { CommitsPanel } from './CommitsPanel';
import { MRsPanel } from './MRsPanel';
import { IssuesPanel } from './IssuesPanel';
import { ProfileReadme } from './ProfileReadme';
import type { UserRecord, UserComplianceDetailResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

function isGitlabSessionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return (
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('gitlab api error')
  );
}

// ── User search dropdown (admin / mentor only) ───────────────────────────────

function UserSearchBox({
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

  const { data: results, isLoading } = useQuery<UserRecord[]>({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
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

  function handleSelect(appUser: UserRecord) {
    if (!appUser.gitlab_username?.trim()) return;
    setQuery(appUser.name || appUser.corpus_username);
    setOpen(false);
    onSelect(
      appUser.gitlab_username.trim(),
      appUser.name || appUser.corpus_username
    );
  }

  const showDropdown = open && debouncedQuery.length >= 1;

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            id="user-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or corpus username…"
            className="w-full px-4 py-2.5 bg-white/20 dark:bg-slate-950/30 border border-slate-300/50 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 hover:border-blue-500/40 transition-all duration-200 backdrop-blur-md"
          />
          {isLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="sm" label="" />
            </span>
          )}
        </div>
      </div>

      {showDropdown && (results ?? []).length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 max-h-[280px] overflow-y-auto p-2 bg-white/75 dark:bg-slate-900/75 border border-slate-200/50 dark:border-white/5 rounded-xl shadow-xl shadow-black/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col gap-1">
          {results!.map((appUser) => {
            const hasGitlab = !!appUser.gitlab_username?.trim();
            return (
              <button
                key={appUser.id}
                type="button"
                onClick={() => handleSelect(appUser)}
                disabled={!hasGitlab}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors border-none bg-transparent ${
                  hasGitlab
                    ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 text-slate-850 dark:text-slate-200'
                    : 'cursor-not-allowed opacity-45'
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  }}
                >
                  {(appUser.name ||
                    appUser.corpus_username)[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {appUser.name || appUser.corpus_username}
                  </p>
                  <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    @{appUser.corpus_username}
                    {appUser.gitlab_username
                      ? ` · GitLab: ${appUser.gitlab_username}`
                      : ' · No GitLab username'}
                  </p>
                </div>

                {/* Role badge */}
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                    appUser.role === 'admin'
                      ? 'bg-red-500/10 text-red-650 dark:text-red-400'
                      : appUser.role === 'mentor'
                        ? 'bg-blue-500/10 text-blue-650 dark:text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450'
                  }`}
                >
                  {appUser.role ?? 'intern'}
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
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-4 bg-white/75 dark:bg-slate-900/75 border border-slate-200/50 dark:border-white/5 rounded-xl shadow-xl shadow-black/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl text-sm text-slate-500 dark:text-slate-400">
            No users found for &quot;{debouncedQuery}&quot;
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

  const {
    data: detailData,
    isLoading: detailLoading,
    isError: detailIsError,
    error: detailError,
    refetch: refetchDetail,
  } = useQuery<UserComplianceDetailResponse>({
    queryKey: ['gitlab-user-detail', queriedUsername],
    queryFn: () => getUserComplianceDetail(queriedUsername),
    enabled: !!queriedUsername,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const profileData = detailData?.profile;
  const commitsData = detailData?.commits;
  const d = profileData?.data;
  const profileOk = profileData?.status?.toLowerCase() === 'success' && !!d;

  function handleExport() {
    if (!commitsData?.commits) return;
    downloadCsv(commitsData.commits as never, `${queriedUsername}_commits.csv`);
  }

  return (
    <div>
      {/* Search — admin / mentor: user search dropdown */}
      {!isIntern && (
        <div className="mb-6">
          <UserSearchBox
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
      {!isIntern && !queriedUsername && !detailLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
          <Search size={36} />
          <p className="text-sm">
            Search a user above to load their GitLab profile.
          </p>
        </div>
      )}

      {/* Intern with no gitlab_username */}
      {isIntern && !internUsername && !detailLoading && (
        <Alert variant="warning" title="GitLab account not linked">
          Your GitLab username is not set. Go to{' '}
          <strong>My Profile → Edit Profile</strong> to add it.
        </Alert>
      )}

      {/* Profile loading */}
      {detailLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" label="" />
          <p className="text-sm text-slate-500">Fetching profile data…</p>
          <p className="text-xs text-slate-400">
            Usually completes in 3–5 seconds
          </p>
        </div>
      )}

      {/* GitLab session error */}
      {detailIsError &&
        (isGitlabSessionError(detailError) ? (
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
                window.location.href = getGitlabLoginUrl();
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
            {(detailError as Error).message}
            <button
              type="button"
              onClick={() => void refetchDetail()}
              className="ml-3 underline text-sm"
            >
              Retry
            </button>
          </Alert>
        ))}

      {/* Backend non-success */}
      {!detailLoading &&
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
      {!detailLoading && profileOk && (
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
            {!commitsData ? (
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
