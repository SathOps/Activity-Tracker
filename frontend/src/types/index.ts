// ── Shared / GitLab primitives ────────────────────────────────────────────

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url?: string;
  web_url?: string;
  email?: string;
  state?: string;
}

// ── Health ───────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'intern' | 'mentor';

export interface HealthResponse {
  status: 'ok';
  gitlab_url: string;
  role: UserRole;
  user: {
    id: number;
    username: string;
    name: string;
    avatar_url?: string;
  };
}

// ── User Profile ──────────────────────────────────────────────────────────

export interface CommitStats {
  total: number;
  morning_commits: number;
  afternoon_commits: number;
  morning_pct?: number;
  afternoon_pct?: number;
}

export interface MRStats {
  total: number;
  merged: number;
  opened: number;
  closed: number;
  pending?: number;
  assigned?: number;
}

export interface IssueStats {
  total: number;
  opened?: number;
  closed: number;
  assigned?: number;
}

export interface CommitEntry {
  project_name: string;
  message: string;
  date: string;
  time: string;
  slot: string;
  sha?: string;
  author_name?: string;
  web_url?: string;
}

export interface MREntry {
  title: string;
  description?: string;
  project_id: number;
  iid: number;
  web_url?: string;
  state: string;
  created_at: string;
  merged_at?: string;
  role: string;
  upvotes: number;
  desc_score?: number;
  quality?: string;
}

export interface IssueEntry {
  title: string;
  state: string;
  created_at: string;
  web_url?: string;
  role: string;
  labels: string[];
}

export interface GroupEntry {
  name: string;
  full_path: string;
  visibility: string;
}

export interface ProjectEntry {
  id: number;
  name: string;
  name_with_namespace: string;
  web_url: string;
  namespace?: Record<string, unknown>;
}

export interface ProfileReadme {
  exists: boolean;
  url?: string;
}

export interface UserProfileData {
  status: string;
  username: string;
  error?: string;
  data?: {
    user: GitLabUser;
    projects: {
      personal: ProjectEntry[];
      contributed: ProjectEntry[];
      all: ProjectEntry[];
    };
    commits: CommitEntry[];
    commit_stats: CommitStats;
    groups: GroupEntry[];
    mrs: MREntry[];
    mr_stats: MRStats;
    mr_quality: Record<string, number>;
    issues: IssueEntry[];
    issue_stats: IssueStats;
    issue_quality: Record<string, number>;
    profile_readme: ProfileReadme;
  };
}

// ── Batch Analytics ───────────────────────────────────────────────────────

export interface BatchUserRow {
  username: string;
  status: string;
  error?: string;
  commits_total?: number;
  commits_morning?: number;
  commits_afternoon?: number;
  projects_authored?: number;
  projects_contributed?: number;
  groups_count?: number;
  mr_total?: number;
  mr_no_desc?: number;
  mr_no_issues?: number;
  mr_no_time?: number;
  mr_failed_pipe?: number;
  mr_no_semantic?: number;
  mr_no_review?: number;
  mr_gt_2_days?: number;
  mr_gt_1_week?: number;
  issue_total?: number;
  issue_closed?: number;
  issue_no_desc?: number;
  issue_no_labels?: number;
  issue_no_milestone?: number;
  issue_no_time?: number;
  issue_long_open?: number;
  issue_no_semantic?: number;
}

export interface SSEProgressEvent {
  type: 'progress' | 'done' | 'error';
  current?: number;
  total?: number;
  username?: string;
  result?: Record<string, unknown>;
  message?: string;
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export interface TeamMember {
  username: string;
}

export interface Team {
  team_name: string;
  project_name: string;
  members: TeamMember[];
  scope?: string;
}

export interface MemberRow {
  username: string;
  status: string;
  total_commits: number;
  morning_commits: number;
  afternoon_commits: number;
  mr_created: number;
  mr_merged: number;
  mr_open: number;
  mr_closed: number;
  mr_assigned: number;
  issues_raised: number;
  issues_closed: number;
  issues_assigned: number;
  groups: number;
  score: number;
  error?: string;
}

export interface TeamTotals {
  total_commits: number;
  morning_commits: number;
  afternoon_commits: number;
  mr_created: number;
  mr_merged: number;
  mr_open: number;
  mr_closed: number;
  mr_assigned: number;
  issues_raised: number;
  issues_closed: number;
  issues_assigned: number;
  team_score: number;
}

export interface TeamResult {
  team_name: string;
  project_name: string;
  members: MemberRow[];
  totals: TeamTotals;
}

// ── Roster Management ─────────────────────────────────────────────────────

export interface BatchRecord {
  id: number;
  name: string;
  date?: string;
  team_count: number;
  member_count: number;
}

export interface TeamRecord {
  id: number;
  name: string;
  batch_name: string;
  member_count: number;
}

export interface MemberRecord {
  id: number;
  name: string;
  gitlab_username: string;
  gitlab_email?: string;
  corpus_username?: string;
  global_username?: string;
  global_email?: string;
  date_of_joining?: string;
  college_name?: string;
  team_name: string;
  batch_name?: string;
}

// ── Weekly Performance ────────────────────────────────────────────────────

export interface EventDetail {
  type: string;
  title: string;
  url: string;
  timestamp?: string;
}

export interface GitLabDailyData {
  mrs: number;
  issues: number;
  commits: number;
  time_spent_seconds: number;
  mrs_open_time: number;
  mrs_merged_time: number;
  issues_open_time: number;
  issues_closed_time: number;
  active_hours: number[];
  activity_timestamps: string[];
  events_by_hour: Record<string, EventDetail[]>;
}

export interface DailyData {
  gitlab: GitLabDailyData;
  corpus: { audio_urls: Record<string, unknown>[] };
}

export interface WeeklyActivity {
  intern_name: string;
  gitlab_username: string;
  corpus_uid: string;
  daily_data: Record<string, DailyData>;
  total_weekly_time: number;
  audio_fetched: boolean;
}

// ── App routing ───────────────────────────────────────────────────────────

export type AppMode =
  | 'standup'
  | 'profile'
  | 'batch'
  | 'leaderboard'
  | 'weekly'
  | 'roster';
