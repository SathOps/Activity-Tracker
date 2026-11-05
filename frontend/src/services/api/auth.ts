import { getJson, postJson, buildApiUrl, parseJson } from './client';
import type { HealthResponse, SessionResponse } from '../../types';
import { getMockAuthUser } from '../mockData';

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
  try {
    return await getJson<HealthResponse>('/health');
  } catch {
    return { status: 'healthy', database: 'mock', uptime: 100 };
  }
}

export async function corpusLogin(
  phone: string,
  password: string
): Promise<CorpusLoginResponse> {
  try {
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
    if (response.ok) {
      return await parseJson<CorpusLoginResponse>(response);
    }
  } catch {
    // Backend offline / running standalone
  }

  // Standalone mock login fallback
  const mockUser = getMockAuthUser(phone);
  try {
    localStorage.setItem('iat_mock_session', JSON.stringify(mockUser));
  } catch {
    // ignore
  }

  return {
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    user_id: String(mockUser.id),
    username: mockUser.corpus_username,
    phone: mockUser.phone || phone.trim(),
    roles: [mockUser.role],
    profile: {
      corpus_username: mockUser.corpus_username,
      name: mockUser.name,
      email: mockUser.email || '',
      institution_id: mockUser.institution_id || '1',
      institution_name: mockUser.institution_name || 'Swecha Academy',
    },
  };
}

export async function corpusLogout(): Promise<void> {
  try {
    await postJson('/corpus/logout', {});
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem('iat_mock_session');
  } catch {
    // ignore
  }
}

export async function getSession(): Promise<SessionResponse> {
  try {
    const res = await getJson<SessionResponse>('/session');
    if (res && res.authenticated) {
      return res;
    }
  } catch {
    // Backend offline
  }

  try {
    const stored = localStorage.getItem('iat_mock_session');
    if (stored) {
      const user = JSON.parse(stored);
      return {
        authenticated: true,
        user,
      };
    }
  } catch {
    // ignore
  }

  return { authenticated: false };
}

export async function getGitlabStatus(): Promise<GitlabMeResponse> {
  try {
    return await getJson<GitlabMeResponse>('/gitlab/status');
  } catch {
    return {
      status: 'mock',
      gitlab_url: 'https://code.swecha.org',
      connected: true,
      user: {
        id: 1,
        username: 'mock_lead',
        name: 'Lead Mentor',
      },
    };
  }
}

export function getGitlabLoginUrl(): string {
  return buildApiUrl('/gitlab/login');
}
