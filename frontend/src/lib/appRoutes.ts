import type { UserRole } from '../types';

export type AppRoute =
  | '/standup'
  | '/my-profile'
  | '/compliance/profile'
  | '/compliance/weekly'
  | '/compliance/mentor-groups'
  | '/compliance/batch'
  | '/compliance/leaderboard'
  | '/manage/batches'
  | '/manage/roles'
  | '/manage/mentor-groups';

export type WorkspaceId = 'standup' | 'compliance' | 'management';

export interface RouteMeta {
  path: AppRoute;
  workspace: WorkspaceId;
  title: string;
  section: string;
  description: string;
  roles: UserRole[];
  requiresGitlab: boolean;
}

export const ROUTES: RouteMeta[] = [
  {
    path: '/standup',
    workspace: 'standup',
    title: 'Standup Tracker',
    section: 'Standup Tracker',
    description:
      'Manage daily standup submissions, verification, audio evidence, and team progress.',
    roles: ['admin', 'mentor', 'intern'],
    requiresGitlab: false,
  },
  {
    path: '/my-profile',
    workspace: 'standup',
    title: 'My Profile',
    section: 'Account',
    description:
      'View your account details, team assignment, and GitLab connection.',
    roles: ['admin', 'mentor', 'intern'],
    requiresGitlab: false,
  },
  {
    path: '/compliance/profile',
    workspace: 'compliance',
    title: 'User Profile',
    section: 'Compliance Checker',
    description:
      'Developer activity, merge requests, issues, and contribution summary.',
    roles: ['admin', 'mentor', 'intern'],
    requiresGitlab: true,
  },
  {
    path: '/compliance/weekly',
    workspace: 'compliance',
    title: 'Weekly Performance',
    section: 'Compliance Checker',
    description: 'Track daily activity patterns and weekly consistency.',
    roles: ['admin', 'mentor', 'intern'],
    requiresGitlab: true,
  },
  {
    path: '/compliance/mentor-groups',
    workspace: 'compliance',
    title: 'Mentor Groups',
    section: 'Compliance Checker',
    description:
      'Create DB-backed intern groups to monitor scoped standup and compliance progress.',
    roles: ['admin', 'mentor'],
    requiresGitlab: true,
  },
  {
    path: '/compliance/batch',
    workspace: 'compliance',
    title: 'Batch Analytics',
    section: 'Compliance Checker',
    description: 'Review activity and progress across multiple developers.',
    roles: ['admin', 'mentor'],
    requiresGitlab: true,
  },
  {
    path: '/compliance/leaderboard',
    workspace: 'compliance',
    title: 'Team Leaderboard',
    section: 'Compliance Checker',
    description: 'Compare team performance, scoring, and contribution trends.',
    roles: ['admin', 'mentor'],
    requiresGitlab: true,
  },
  {
    path: '/manage/batches',
    workspace: 'management',
    title: 'Batches',
    section: 'Admin / Management',
    description: 'Manage internship cohorts and review their date ranges.',
    roles: ['admin'],
    requiresGitlab: false,
  },
  {
    path: '/manage/roles',
    workspace: 'management',
    title: 'Role Assignment',
    section: 'Admin / Management',
    description:
      'Assign application roles using Corpus usernames as the identity anchor.',
    roles: ['admin'],
    requiresGitlab: false,
  },
  {
    path: '/manage/mentor-groups',
    workspace: 'management',
    title: 'Mentor Groups',
    section: 'Admin / Management',
    description:
      'Assign interns to mentor-owned groups for standup and compliance tracking.',
    roles: ['admin', 'mentor'],
    requiresGitlab: false,
  },
];

export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, AppRoute> = {
  admin: '/standup',
  mentor: '/standup',
  intern: '/standup',
};

export function getRouteMeta(pathname: string): RouteMeta {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/standup';
  const exact = ROUTES.find((route) => route.path === normalizedPath);
  if (exact) {
    return exact;
  }

  const workspaceMatch = ROUTES.find((route) =>
    normalizedPath.startsWith(
      route.workspace === 'standup' ? '/standup' : `/${route.workspace}`
    )
  );

  return workspaceMatch ?? ROUTES[0];
}
