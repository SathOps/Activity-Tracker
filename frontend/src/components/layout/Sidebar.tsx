import {
  BarChart3,
  Calendar,
  Database,
  Eye,
  EyeOff,
  LogOut,
  Mic,
  RefreshCw,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { corpusLogout, storeGitlabToken } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, type AppRoute, type WorkspaceId } from '../../lib/appRoutes';
import { cn } from '../../lib/utils';
import { useRouter } from '../../lib/router';
import { useHealth } from '../../hooks/useHealth';
import { useConfigStore } from '../../stores/configStore';

interface NavItem {
  path: AppRoute;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const WORKSPACE_ITEMS: {
  workspace: WorkspaceId;
  path: AppRoute;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    workspace: 'standup',
    path: '/standup',
    label: 'Standup Tracker',
    desc: 'Daily submissions',
    icon: <Mic size={16} />,
  },
  {
    workspace: 'compliance',
    path: '/compliance/profile',
    label: 'Compliance',
    desc: 'GitLab analytics',
    icon: <BarChart3 size={16} />,
  },
  {
    workspace: 'management',
    path: '/manage/batches',
    label: 'Management',
    desc: 'Batches, roles, mentor groups',
    icon: <Database size={16} />,
  },
];

const SUBNAV_ITEMS: Record<Exclude<WorkspaceId, 'standup'>, NavItem[]> = {
  compliance: [
    {
      path: '/compliance/profile',
      label: 'User Profile',
      desc: 'Developer activity',
      icon: <User size={16} />,
    },
    {
      path: '/compliance/weekly',
      label: 'Weekly Performance',
      desc: 'Activity grid',
      icon: <Calendar size={16} />,
    },
    {
      path: '/compliance/mentor-groups',
      label: 'Mentor Groups',
      desc: 'DB-backed intern groups',
      icon: <Users size={16} />,
    },
    {
      path: '/compliance/batch',
      label: 'Batch Analytics',
      desc: 'Bulk developer reports',
      icon: <BarChart3 size={16} />,
    },
    {
      path: '/compliance/leaderboard',
      label: 'Leaderboard',
      desc: 'Team ranking',
      icon: <Trophy size={16} />,
    },
  ],
  management: [
    {
      path: '/manage/batches',
      label: 'Batches',
      desc: 'Cohort durations',
      icon: <Database size={16} />,
    },
    {
      path: '/manage/roles',
      label: 'Roles',
      desc: 'Roles and standup edit permission',
      icon: <Database size={16} />,
    },
    {
      path: '/manage/mentor-groups',
      label: 'Mentor Groups',
      desc: 'Assign interns to mentors',
      icon: <Users size={16} />,
    },
  ],
};

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function Sidebar() {
  const { pathname, navigate } = useRouter();
  const { user } = useAuth();
  const {
    gitlabUrl,
    gitlabToken,
    corpusUser,
    setGitlabUrl,
    setGitlabToken,
    clearCorpusToken,
    resetCredentials,
  } = useConfigStore();
  const { data: health, isLoading, refetch } = useHealth();
  const [showToken, setShowToken] = useState(false);
  const [gitlabTokenInput, setGitlabTokenInput] = useState('');
  const [gitlabError, setGitlabError] = useState<string | null>(null);
  const [gitlabSubmitting, setGitlabSubmitting] = useState(false);

  const currentRoute =
    ROUTES.find((route) => route.path === pathname) ??
    ROUTES.find((route) => pathname.startsWith(`/${route.workspace}`)) ??
    ROUTES[0];
  const activeWorkspace = currentRoute.workspace;

  const workspaceItems = useMemo(
    () =>
      WORKSPACE_ITEMS.filter((item) =>
        item.workspace === 'management' ? user?.role === 'admin' : true
      ),
    [user?.role]
  );

  const subnavItems = useMemo(() => {
    if (activeWorkspace === 'standup') {
      return [];
    }

    return SUBNAV_ITEMS[activeWorkspace].filter((item) => {
      const meta = ROUTES.find((route) => route.path === item.path);
      return meta ? meta.roles.includes(user?.role || 'intern') : false;
    });
  }, [activeWorkspace, user?.role]);

  async function handleCorpusLogout() {
    await corpusLogout().catch(() => undefined);
    clearCorpusToken();
    resetCredentials();
    navigate('/');
  }

  async function handleGitlabSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gitlabTokenInput.trim()) {
      return;
    }

    setGitlabSubmitting(true);
    setGitlabError(null);
    try {
      await storeGitlabToken(gitlabTokenInput.trim(), gitlabUrl);
      setGitlabToken('session');
      setGitlabTokenInput('');
      await refetch();
    } catch (caught) {
      setGitlabToken('');
      setGitlabError(
        caught instanceof Error ? caught.message : 'GitLab validation failed'
      );
    } finally {
      setGitlabSubmitting(false);
    }
  }

  const displayName = corpusUser || user?.corpusUsername || 'User';

  return (
    <aside
      className="sidebar-shell"
      style={{
        width: 280,
        flexShrink: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--sidebar-border)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            }}
          >
            📊
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--sidebar-text-bright)',
                letterSpacing: '-0.01em',
              }}
            >
              Activity Tracker
            </h1>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: 'rgba(148, 163, 184, 0.6)',
                letterSpacing: '0.02em',
              }}
            >
              Internship workspace
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {/* User card */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 16,
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserAvatar name={displayName} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--sidebar-text-bright)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 4,
                  padding: '2px 8px',
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                {user?.role || 'intern'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleCorpusLogout()}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: 8,
                cursor: 'pointer',
                color: 'var(--sidebar-text)',
                display: 'flex',
                transition: 'all 0.2s',
              }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Workspace nav */}
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: 'rgba(148, 163, 184, 0.45)',
            margin: '0 0 8px 8px',
          }}
        >
          Workspaces
        </p>
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginBottom: 20,
          }}
        >
          {workspaceItems.map((item) => {
            const isActive = activeWorkspace === item.workspace;
            return (
              <button
                key={item.workspace}
                type="button"
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                    : 'transparent',
                  color: isActive ? '#e0e7ff' : 'var(--sidebar-text)',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: 99,
                      background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                    }}
                  />
                )}
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                      : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : 'var(--sidebar-text)',
                    flexShrink: 0,
                    boxShadow: isActive
                      ? '0 4px 12px rgba(79, 70, 229, 0.3)'
                      : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.icon}
                </span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: '1px 0 0',
                      fontSize: 11,
                      color: isActive
                        ? 'rgba(165, 180, 252, 0.7)'
                        : 'rgba(148, 163, 184, 0.45)',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* GitLab section for compliance */}
        {activeWorkspace === 'compliance' ? (
          <section style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(148, 163, 184, 0.45)',
                margin: '0 0 8px 8px',
              }}
            >
              GitLab Access
            </p>
            <form
              style={{
                padding: 14,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
              onSubmit={handleGitlabSubmit}
            >
              <div>
                <label
                  htmlFor="gitlab-url"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--sidebar-text)',
                    marginBottom: 4,
                  }}
                >
                  GitLab URL
                </label>
                <input
                  id="gitlab-url"
                  type="url"
                  value={gitlabUrl}
                  onChange={(event) => setGitlabUrl(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--sidebar-text-bright)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="gitlab-token"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--sidebar-text)',
                    marginBottom: 4,
                  }}
                >
                  Personal access token
                </label>
                <div className="relative">
                  <input
                    id="gitlab-token"
                    type={showToken ? 'text' : 'password'}
                    value={gitlabTokenInput}
                    onChange={(event) =>
                      setGitlabTokenInput(event.target.value)
                    }
                    placeholder="glpat-xxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--sidebar-text-bright)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((current) => !current)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--sidebar-text)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={gitlabSubmitting || !gitlabTokenInput.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity:
                    gitlabSubmitting || !gitlabTokenInput.trim() ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {gitlabSubmitting ? 'Validating…' : 'Connect GitLab'}
              </button>
              {gitlabError ? (
                <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>
                  {gitlabError}
                </p>
              ) : null}
            </form>

            <div
              style={{
                marginTop: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(148, 163, 184, 0.5)',
                  }}
                >
                  Session
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 12,
                    fontWeight: 500,
                    color: gitlabToken ? '#10b981' : 'var(--sidebar-text)',
                  }}
                >
                  {gitlabToken
                    ? health
                      ? '● Connected'
                      : '○ Pending'
                    : '○ Not connected'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={!gitlabToken || isLoading}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  color: 'var(--sidebar-text)',
                  opacity: !gitlabToken || isLoading ? 0.4 : 1,
                  display: 'flex',
                }}
              >
                <RefreshCw
                  size={13}
                  className={isLoading ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </section>
        ) : null}

        {/* Sub-navigation */}
        {subnavItems.length > 0 ? (
          <section>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(148, 163, 184, 0.45)',
                margin: '0 0 8px 8px',
              }}
            >
              Navigation
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {subnavItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'sidebar-nav-item',
                      isActive && 'sidebar-nav-item--active'
                    )}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                      background: isActive
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                      color: isActive ? '#e0e7ff' : 'var(--sidebar-text)',
                    }}
                  >
                    <span
                      style={{ opacity: isActive ? 1 : 0.5, display: 'flex' }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </section>
        ) : null}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--sidebar-border)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: 'rgba(148, 163, 184, 0.35)',
            letterSpacing: '0.04em',
          }}
        >
          Activity Tracker v2.0
        </p>
      </div>
    </aside>
  );
}
