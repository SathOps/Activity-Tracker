import {
  buildCorpusApiUrl,
  getCorpusApiBaseUrl,
} from '../services/corpus/apiUrl';
import { useConfigStore } from '../stores/configStore';
import type {
  BatchRecord,
  HealthResponse,
  MemberRecord,
  Team,
  TeamResult,
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
  const { gitlabToken, gitlabUrl } = useConfigStore.getState();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (gitlabUrl) {
    headers['x-gitlab-url'] = gitlabUrl;
  }

  if (gitlabToken) {
    headers['x-gitlab-token'] = gitlabToken;
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
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

async function deleteJson(path: string): Promise<void> {
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  await parseJson<unknown>(response);
}

interface CorpusLoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  phone: string;
  roles: string[];
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
      const response = await fetch(buildCorpusApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
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

export async function getUserProfile(
  username: string
): Promise<UserProfileData> {
  return getJson<UserProfileData>(
    `/users/${encodeURIComponent(username)}/profile`
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
  const payload = await getJson<{ batches: BatchRecord[] }>('/roster/batches');
  return payload.batches;
}

export async function createBatch(
  name: string,
  date?: string
): Promise<BatchRecord> {
  return postJson('/roster/batches', { name, date });
}

export async function deleteBatch(batchId: number): Promise<void> {
  return deleteJson(`/roster/batches/${batchId}`);
}

export async function getMembers(): Promise<MemberRecord[]> {
  const payload = await getJson<{ members: MemberRecord[] }>('/roster/members');
  return payload.members;
}

export async function deleteMember(memberId: number): Promise<void> {
  return deleteJson(`/roster/members/${memberId}`);
}

export async function bulkImportMembers(
  batchId: number,
  file: File
): Promise<{ imported: number; errors: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(buildApiUrl(`/roster/import/${batchId}`), {
    method: 'POST',
    headers: buildHeaders(),
    body: form,
  });
  return parseJson(response);
}

export async function getWeeklyPerformance(params: {
  gitlab_username: string;
  corpus_uid?: string;
  start_date: string;
  end_date: string;
  corpus_token?: string;
}): Promise<WeeklyActivity> {
  return postJson('/weekly-performance/single', params);
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

export function buildBatchStreamUrl(
  usernames: string[],
  projectIds?: number[],
  since?: string,
  until?: string
): string {
  const params = new URLSearchParams();
  params.set('usernames', usernames.join(','));
  if (projectIds?.length) {
    params.set('project_ids', projectIds.join(','));
  }
  if (since) {
    params.set('since', since);
  }
  if (until) {
    params.set('until', until);
  }
  return `${getApiBaseUrl()}/batch/stream?${params.toString()}`;
}

export function getCorpusRuntimeBaseUrl(): string {
  return getCorpusApiBaseUrl();
}
