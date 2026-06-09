import {
  BarChart3,
  Calendar,
  Database,
  LogOut,
  Mic,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import { getGitlabLoginUrl } from '../../services/api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, type AppRoute, type WorkspaceId } from '../../lib/appRoutes';
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
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-[13px] font-bold text-white tracking-wider shrink-0 shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20 dark:ring-blue-400/20 transition-all">
      {initials}
    </div>
  );
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
    onClose?.();
  }

  const displayName =
    user?.name || corpusUser || user?.corpusUsername || 'User';

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden cursor-default w-full h-full border-none outline-none"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      )}
      <aside
        className={`
          w-[300px]
          h-screen
          flex
          flex-col
          shrink-0
          z-50
          transition-transform
          duration-300
          ease-in-out
          fixed
          inset-y-0
          left-0
          md:relative
          md:translate-x-0
          bg-gradient-to-b
          from-[#182647]
          via-[#111c34]
          to-[#0c1222]
          dark:from-[#182647]
          dark:via-[#111c34]
          dark:to-[#0c1222]
          border-r
          border-white/5
          dark:border-white/5
          backdrop-blur-[24px]
          shadow-[18px_0_48px_rgba(0,0,0,0.55)]
          dark:shadow-[18px_0_48px_rgba(0,0,0,0.55)]
          text-slate-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Top edge glow line */}
        <div aria-hidden="true" className="flowing-gradient-line" />

        {/* Ambient glow - top right */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(30, 79, 178, 0.14), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Ambient glow - bottom left */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(14, 165, 233, 0.07), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo / Header */}
        <div className="py-7 px-6 relative z-10 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-xl font-extrabold font-display text-slate-50 dark:text-slate-50 tracking-tight leading-none">
              Activity Tracker
            </h1>
            <p className="m-0 mt-1.5 text-[10.5px] font-bold font-display uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
              Internship workspace
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-400 dark:text-slate-400 hover:text-white dark:hover:text-white rounded-lg hover:bg-slate-800/40 dark:hover:bg-slate-800/40 border border-transparent transition-all flex items-center justify-center shrink-0"
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          )}
          {/* Solid light blue separator line */}
          <div className="absolute bottom-0 left-6 right-6 h-[1.5px] bg-blue-400/20 dark:bg-blue-400/20" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 relative z-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
          {/* Workspace section */}
          <div>
            <p className="font-display tracking-[0.16em] uppercase text-[10px] font-bold text-slate-500 dark:text-slate-500 m-0 mb-3.5 ml-2">
              Workspaces
            </p>
            <nav className="flex flex-col gap-2">
              {workspaceItems.map((item) => {
                const isActive = activeWorkspace === item.workspace;
                return (
                  <button
                    key={item.workspace}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      onClose?.();
                    }}
                    className={`flex items-center gap-3.5 w-full p-3 rounded-xl cursor-pointer text-left transition-all duration-300 relative group hover:scale-[1.012] hover:-translate-y-[0.5px]
                      ${
                        isActive
                          ? 'bg-blue-500/10 dark:bg-blue-500/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-blue-400/30 dark:border-blue-400/30 backdrop-blur-md'
                          : 'bg-transparent text-slate-400 dark:text-slate-400 hover:bg-slate-800/40 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200 border border-transparent'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute -left-px top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    )}
                    <span
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border
                        ${
                          isActive
                            ? 'bg-blue-600/15 dark:bg-blue-600/15 text-white border-blue-500/20 dark:border-blue-500/20 shadow-inner brightness-105'
                            : 'bg-slate-800/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 border-transparent group-hover:bg-slate-800/80 dark:group-hover:bg-slate-800/80 group-hover:text-slate-200 dark:group-hover:text-slate-200'
                        }
                      `}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p
                        className={`m-0 text-[13px] font-semibold font-display tracking-tight transition-colors
                        ${isActive ? 'text-slate-50 dark:text-slate-50' : 'text-slate-300 dark:text-slate-300'}
                      `}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`m-0 mt-0.5 text-[11px] font-medium transition-colors
                        ${isActive ? 'text-blue-300/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-500'}
                      `}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GitLab section */}
          {activeWorkspace === 'compliance' ? (
            <section className="mb-2">
              <p className="font-display tracking-[0.16em] uppercase text-[10px] font-bold text-slate-500 dark:text-slate-500 m-0 mb-2.5 ml-2">
                GitLab Access
              </p>
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 dark:border-blue-500/15 backdrop-blur-md flex flex-col gap-3 shadow-none dark:shadow-none">
                {/* Status row */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 animate-pulse
                    ${gitlabConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-500 dark:bg-slate-500'}
                  `}
                  />
                  <span
                    className={`text-xs font-semibold tracking-tight
                    ${gitlabConnected ? 'text-emerald-400 dark:text-emerald-450' : 'text-slate-400 dark:text-slate-400'}
                  `}
                  >
                    {gitlabConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {gitlabConnected ? (
                  <p className="m-0 text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed font-sans font-medium">
                    GitLab session is active. Compliance tools are fully
                    available.
                  </p>
                ) : (
                  <>
                    <p className="m-0 text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed font-sans font-medium">
                      Connect your GitLab account via OAuth to enable compliance
                      features.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = getGitlabLoginUrl();
                      }}
                      className="relative overflow-hidden inline-flex items-center gap-2.5 border-none font-display font-bold cursor-pointer px-4 py-2.5 rounded-xl text-xs tracking-[0.02em] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700 bg-[length:200%_auto] text-white transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 hover:scale-[1.015] hover:shadow-[0_8px_20px_rgba(37,99,235,0.35),0_0_12px_rgba(59,130,246,0.2)] hover:bg-right active:translate-y-0 active:scale-[0.98] after:absolute after:top-0 after:w-1/2 after:h-full after:pointer-events-none after:left-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent after:skew-x-[-25deg] after:animate-[shimmer-sweep_3s_infinite_ease-in-out] w-full justify-center"
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
              <p className="font-display tracking-[0.16em] uppercase text-[10px] font-bold text-slate-500 dark:text-slate-500 m-0 mb-2.5 ml-2">
                Navigation
              </p>
              <nav className="flex flex-col gap-1">
                {subnavItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        onClose?.();
                      }}
                      className={`flex items-center gap-3.5 w-full px-3.5 py-2.5 rounded-xl border-none cursor-pointer text-left transition-all duration-200 group
                        ${
                          isActive
                            ? 'bg-blue-500/15 dark:bg-blue-500/15 text-blue-100 dark:text-blue-100 font-semibold'
                            : 'bg-transparent text-white dark:text-slate-400 hover:bg-slate-800/20 dark:hover:bg-slate-800/20 hover:text-slate-200 dark:hover:text-slate-200'
                        }
                      `}
                    >
                      <span
                        className={`transition-transform duration-250 flex items-center group-hover:scale-110
                        ${isActive ? 'text-blue-400 dark:text-blue-400 opacity-100' : 'text-slate-400 dark:text-slate-400 opacity-70 group-hover:opacity-100'}
                      `}
                      >
                        {item.icon}
                      </span>
                      <span className="font-display text-[12.5px] font-semibold tracking-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </section>
          ) : null}
        </div>

        {/* Floating Footer Section */}
        <div className="px-4 pb-4 pt-2 mt-auto relative z-10">
          <div className="p-4 rounded-2xl border bg-white border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] hover:border-slate-300 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_10px_10px_-5px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-slate-900/40 dark:backdrop-blur-md dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] dark:hover:border-white/10 hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/my-profile');
                    onClose?.();
                  }}
                  className="bg-transparent border-none p-0 cursor-pointer shrink-0 transition-transform active:scale-95"
                  title="View my profile"
                >
                  <UserAvatar name={displayName} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-semibold font-display text-slate-900 dark:text-white truncate leading-snug">
                    {displayName}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border
                    ${
                      user?.role === 'admin'
                        ? 'bg-rose-100 text-rose-600 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                        : user?.role === 'mentor'
                          ? 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                          : 'bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    }
                  `}
                  >
                    {user?.role || 'intern'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleCorpusLogout}
                className="flex items-center justify-center p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/5 dark:hover:bg-rose-500/15 dark:border-rose-500/20 dark:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-all duration-200 active:scale-95"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Version text */}
          <p className="m-0 mt-3 text-[9px] font-sans font-medium text-slate-600 dark:text-slate-600 tracking-wider text-center">
            Activity Tracker v2.0
          </p>
        </div>
        {/* Flowing gradient line at the bottom */}
        <div aria-hidden="true" className="flowing-gradient-line-bottom" />
      </aside>
    </>
  );
}
