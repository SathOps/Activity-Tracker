import {
  BarChart3,
  Calendar,
  Database,
  LogOut,
  Mic,
  Trophy,
  User,
} from 'lucide-react';
import { useMemo } from 'react';
import { getGitlabLoginUrl } from '../../services/api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, type AppRoute, type WorkspaceId } from '../../lib/appRoutes';
import { cn } from '../../lib/utils';
import { useRouter } from '../../lib/router';
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
        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.02em',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
      }}
    >
      {initials}
    </div>
  );
}

export function Sidebar() {
  const { pathname, navigate } = useRouter();
  const { user, gitlabConnected, logout } = useAuth();
  const { corpusUser } = useConfigStore();

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
    await logout();
    navigate('/');
  }

  const displayName =
    user?.name || corpusUser || user?.corpusUsername || 'User';

  return (
    <aside
      className="
    w-[300px]
    h-screen
    flex
    flex-col
    shrink-0
    relative
    overflow-hidden
    backdrop-blur-2xl
    border-r
    border-white/10
    shadow-[0_0_60px_rgba(59,130,246,0.12)]
    bg-[#0e1629]/75
  "
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
            'radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)',
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
              width: 52,
              height: 52,
              borderRadius: 18,

              background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.35)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#ffffff', width: 24, height: 24 }}
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
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
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Mic size={18} className="text-blue-400" />
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
                  border: isActive
                    ? '1px solid rgba(59, 130, 246, 0.25)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(79, 70, 229, 0.15))'
                    : 'transparent',
                  boxShadow: isActive
                    ? '0 0 25px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : 'none',
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
                      background: 'linear-gradient(180deg, #3b82f6, #4f46e5)',
                    }}
                  />
                )}
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive
                      ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                      : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : 'var(--sidebar-text)',
                    flexShrink: 0,
                    boxShadow: isActive
                      ? '0 4px 12px rgba(37, 99, 235, 0.3)'
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
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background:
                  'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.03))',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                boxShadow:
                  '0 0 25px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Status row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: gitlabConnected ? '#10b981' : '#94a3b8',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: gitlabConnected ? '#10b981' : 'var(--sidebar-text)',
                  }}
                >
                  {gitlabConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>

              {gitlabConnected ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'rgba(148,163,184,0.6)',
                    lineHeight: 1.5,
                  }}
                >
                  GitLab session is active. Compliance tools are fully
                  available.
                </p>
              ) : (
                <>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'rgba(148,163,184,0.6)',
                      lineHeight: 1.5,
                    }}
                  >
                    Connect your GitLab account via OAuth to enable compliance
                    features.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = getGitlabLoginUrl();
                    }}
                    className="premium-gitlab-btn pulse-animation"
                    style={{
                      padding: '9px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
                    </svg>
                    Connect with GitLab
                  </button>
                </>
              )}
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

      {/* Footer / Profile Section */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--sidebar-border)',
          position: 'relative',
          background:
            'linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))',
        }}
      >
        {/* Profile Info & Trigger Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              flex: 1,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/my-profile')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="View my profile"
            >
              <UserAvatar name={displayName} />
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
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
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background:
                    user?.role === 'admin'
                      ? 'rgba(244, 63, 94, 0.15)'
                      : user?.role === 'mentor'
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                  color:
                    user?.role === 'admin'
                      ? '#fb7185'
                      : user?.role === 'mentor'
                        ? '#60a5fa'
                        : '#34d399',
                  border:
                    user?.role === 'admin'
                      ? '1px solid rgba(244, 63, 94, 0.25)'
                      : user?.role === 'mentor'
                        ? '1px solid rgba(59, 130, 246, 0.25)'
                        : '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                {user?.role || 'intern'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleCorpusLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Small version text at the very bottom */}
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: 9,
            color: 'rgba(148, 163, 184, 0.25)',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
        >
          Activity Tracker v2.0
        </p>
      </div>
    </aside>
  );
}
