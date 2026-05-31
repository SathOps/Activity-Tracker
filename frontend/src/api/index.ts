import { useConfigStore } from '../stores/configStore';
import type {
  BatchRecord,
  HealthResponse,
  MyProfileResponse,
  MyTeamResponse,
  TeamRecord,
  Team,
  TeamDetailRecord,
  TeamResult,
  UserRecord,
  UserCommitsResponse,
  UserProfileData,
  WeeklyActivity,
} from '../types';

function getApiBaseUrl(): string {
  const configuredBase = (import.meta.env.VITE_API_URL || '').trim();
  return configuredBase ? `${configuredBase.replace(/\/+$/, '')}/api` : '/api';
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

function buildHeaders(): HeadersInit {
  const { accessToken } = useConfigStore.getState();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = '';
    try {
      const payload = (await response.json()) as {
        detail?: string;
        message?: string;
      };
      detail = payload.detail || payload.message || '';
    } catch {
      detail = '';
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: buildHeaders(),
    credentials: 'include',
  });
  return parseJson<T>(response);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      ...(buildHeaders() as Record<string, string>),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

async function deleteJson(path: string): Promise<void> {
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  });
  await parseJson<unknown>(response);
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: 'PATCH',
    headers: {
      ...(buildHeaders() as Record<string, string>),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

interface CorpusLoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  phone: string;
  roles: string[];
  profile?: {
    corpus_username: string;
    name: string;
    email: string;
    institution_id: string;
    institution_name: string;
  };
}

export interface GitlabMeResponse {
  status: string;
  gitlab_url: string;
  connected: boolean;
  user: {
    id: number;
    username: string;
    name: string;
    avatar_url?: string;
  };
}

function buildPhoneCandidates(phone: string): string[] {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (!normalizedPhone) {
    return [];
  }

  return [
    ...new Set([
      normalizedPhone,
      `91${normalizedPhone}`,
      `+91${normalizedPhone}`,
    ]),
  ];
}

export async function checkHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health');
}

export async function corpusLogin(
  phone: string,
  password: string
): Promise<CorpusLoginResponse> {
  const candidates = buildPhoneCandidates(phone);
  let lastError = 'Corpus login failed';

  for (const candidate of candidates) {
    try {
      const response = await fetch(buildApiUrl('/corpus/login'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: candidate,
          password,
        }),
      });

      if (response.ok) {
        return (await response.json()) as CorpusLoginResponse;
      }

      try {
        const payload = (await response.json()) as {
          detail?: string;
          message?: string;
        };
        lastError = payload.detail || payload.message || lastError;
      } catch {
        lastError = `Corpus login failed (${response.status})`;
      }
    } catch (caught) {
      lastError = caught instanceof Error ? caught.message : String(caught);
    }
  }

  throw new Error(lastError);
}

export async function corpusLogout(): Promise<void> {
  await postJson('/corpus/logout', {});
}

export async function getMyProfile(): Promise<MyProfileResponse> {
  return getJson<MyProfileResponse>('/me');
}

export async function updateMyProfile(payload: {
  gitlab_username?: string;
  global_username?: string;
  global_email?: string;
  date_of_joining?: string;
}): Promise<MyProfileResponse> {
  return patchJson<MyProfileResponse>('/me', payload);
}

export async function setMyBatch(batchId: number): Promise<MyProfileResponse> {
  return patchJson<MyProfileResponse>('/me/batch', { batch_id: batchId });
}

export async function getGitlabStatus(): Promise<GitlabMeResponse> {
  return getJson<GitlabMeResponse>('/gitlab/status');
}

export function getGitlabLoginUrl(): string {
  return buildApiUrl('/gitlab/login');
}

export async function getMyTeam(): Promise<MyTeamResponse> {
  return getJson<MyTeamResponse>('/me/team');
}

export async function getUserProfile(
  username: string
): Promise<UserProfileData> {
  return getJson<UserProfileData>(
    `/compliance/users/${encodeURIComponent(username)}/profile`
  );
}

export async function getUserCommits(
  username: string,
  params?: { since?: string; until?: string; project_ids?: number[] }
): Promise<UserCommitsResponse> {
  const qs = new URLSearchParams();
  if (params?.since) qs.set('since', params.since);
  if (params?.until) qs.set('until', params.until);
  if (params?.project_ids?.length)
    qs.set('project_ids', params.project_ids.join(','));
  const query = qs.toString();
  return getJson(
    `/compliance/users/${encodeURIComponent(username)}/commits${query ? `?${query}` : ''}`
  );
}

export async function resolveProjects(
  projectPaths: string[]
): Promise<{ resolved: number[]; failed: string[] }> {
  return postJson('/batch/resolve-projects', {
    project_paths: projectPaths,
  });
}

export async function analyzeTeams(
  teams: Team[],
  since?: string,
  until?: string
): Promise<TeamResult[]> {
  const payload = await postJson<{ teams: TeamResult[] }>(
    '/leaderboard/analyze',
    { teams, since, until }
  );
  return payload.teams;
}

export async function getTeams(): Promise<Team[]> {
  const payload = await getJson<{ teams: Team[] }>('/leaderboard/teams');
  return payload.teams;
}

export async function getBatches(): Promise<BatchRecord[]> {
  const payload = await getJson<{ batches: BatchRecord[] }>('/batches/');
  return payload.batches;
}

export async function createBatch(
  name: string,
  start_date?: string,
  end_date?: string
): Promise<BatchRecord> {
  return postJson('/batches/', { name, start_date, end_date });
}

export async function deleteBatch(batchId: number): Promise<void> {
  return deleteJson(`/batches/${batchId}`);
}

export async function updateBatch(
  batchId: number,
  updates: { name?: string; start_date?: string; end_date?: string }
): Promise<BatchRecord> {
  return patchJson(`/batches/${batchId}`, updates);
}

export async function getUsers(): Promise<UserRecord[]> {
  const payload = await getJson<{ users: UserRecord[] }>('/users/');
  return payload.users;
}

export async function getTeamsByBatchIds(
  batchIds: number[]
): Promise<TeamRecord[]> {
  const params = new URLSearchParams();
  params.set('batch_ids', batchIds.join(','));
  const payload = await getJson<{ teams: TeamRecord[] }>(
    `/teams/?${params.toString()}`
  );
  return payload.teams;
}

export async function getUsersByTeamIds(
  teamIds: number[]
): Promise<UserRecord[]> {
  const params = new URLSearchParams();
  params.set('team_ids', teamIds.join(','));
  const payload = await getJson<{ users: UserRecord[] }>(
    `/users/?${params.toString()}`
  );
  return payload.users;
}

export async function getRosterTeams(
  activeOnly = false
): Promise<TeamRecord[]> {
  const params = new URLSearchParams();
  if (activeOnly) {
    params.set('active_only', 'true');
  }
  const query = params.toString();
  const payload = await getJson<{ teams: TeamRecord[] }>(
    `/teams/${query ? `?${query}` : ''}`
  );
  return payload.teams;
}

export async function deleteUser(userId: number): Promise<void> {
  return deleteJson(`/users/${userId}`);
}

export async function searchUsers(query: string): Promise<UserRecord[]> {
  const payload = await getJson<{ users: UserRecord[] }>(
    `/users/?q=${encodeURIComponent(query)}`
  );
  return payload.users;
}

export async function bulkImportUsers(
  batchId: number,
  file: File
): Promise<{ imported: number; errors: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(buildApiUrl(`/users/import/${batchId}`), {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: form,
  });
  return parseJson(response);
}

export async function createUser(payload: {
  name: string;
  corpus_username: string;
  batch_id: number;
  role?: string;
  team_name?: string;
  email?: string;
  institution_id?: string;
  institution_name?: string;
  gitlab_username?: string;
  global_username?: string;
  global_email?: string;
  date_of_joining?: string;
}): Promise<UserRecord> {
  return postJson('/users/', payload);
}

export async function updateUser(
  userId: number,
  payload: {
    name: string;
    batch_id: number;
    role?: string;
    team_name?: string;
    email?: string;
    institution_id?: string;
    institution_name?: string;
    gitlab_username?: string;
    global_username?: string;
    global_email?: string;
    date_of_joining?: string;
  }
): Promise<UserRecord> {
  return patchJson(`/users/${userId}`, payload);
}

export async function assignUserRole(
  userId: number,
  role: string
): Promise<UserRecord> {
  return patchJson(`/users/${userId}`, { role });
}

export async function createTeam(payload: {
  name: string;
  batch_id: number;
}): Promise<TeamRecord> {
  return postJson('/teams/', payload);
}

export async function updateTeam(
  teamId: number,
  name: string
): Promise<TeamRecord> {
  return patchJson(`/teams/${teamId}`, { name });
}

export async function deleteTeam(teamId: number): Promise<void> {
  return deleteJson(`/teams/${teamId}`);
}

export async function getTeamDetail(teamId: number): Promise<TeamDetailRecord> {
  return getJson<TeamDetailRecord>(`/teams/${teamId}`);
}

export async function addUserToTeam(
  teamId: number,
  corpusUsername: string
): Promise<UserRecord> {
  return postJson(`/teams/${teamId}/users`, {
    corpus_username: corpusUsername,
  });
}

export async function removeUserFromTeam(
  teamId: number,
  userId: number
): Promise<void> {
  return deleteJson(`/teams/${teamId}/users/${userId}`);
}

export async function getWeeklyPerformance(params: {
  start_date: string;
  end_date: string;
}): Promise<WeeklyActivity> {
  return postJson('/weekly-performance/single', params);
}

export async function getWeeklyPerformanceBatch(params: {
  start_date: string;
  end_date: string;
  interns: Array<{ gitlab_username: string }>;
}): Promise<WeeklyActivity[]> {
  return postJson('/weekly-performance/batch', params);
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  rows: Record<string, unknown>[],
  filename: string
): void {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildStreamParams(
  usernames: string[],
  projectIds?: number[],
  since?: string,
  until?: string,
  mode?: 'combined' | 'profile' | 'commits'
): string {
  const params = new URLSearchParams();
  params.set('usernames', usernames.join(','));
  if (projectIds?.length) params.set('project_ids', projectIds.join(','));
  if (since) params.set('since', since);
  if (until) params.set('until', until);
  if (mode) params.set('mode', mode);
  return params.toString();
}

export function buildBatchStreamUrl(
  usernames: string[],
  projectIds?: number[],
  since?: string,
  until?: string,
  mode?: 'combined' | 'profile' | 'commits'
): string {
  return `${getApiBaseUrl()}/batch/stream?${buildStreamParams(usernames, projectIds, since, until, mode)}`;
}

export function getCorpusRuntimeBaseUrl(): string {
  return getApiBaseUrl();
}
