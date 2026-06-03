import { getJson, postJson, buildApiUrl, parseJson } from './client';
import type { HealthResponse, SessionResponse } from '../../types';

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

export async function checkHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health');
}

export async function corpusLogin(
  phone: string,
  password: string
): Promise<CorpusLoginResponse> {
  const response = await fetch(buildApiUrl('/corpus/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      phone: phone.trim(),
      password,
    }),
  });
  return parseJson<CorpusLoginResponse>(response);
}

export async function corpusLogout(): Promise<void> {
  await postJson('/corpus/logout', {});
}

export async function getSession(): Promise<SessionResponse> {
  return getJson<SessionResponse>('/session');
}

export async function getGitlabStatus(): Promise<GitlabMeResponse> {
  return getJson<GitlabMeResponse>('/gitlab/status');
}

export function getGitlabLoginUrl(): string {
  return buildApiUrl('/gitlab/login');
}
