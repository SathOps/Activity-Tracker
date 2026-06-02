import { useConfigStore } from '../../stores/configStore';

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

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: buildHeaders(),
    credentials: 'include',
  });
  return parseJson<T>(response);
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
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

export async function deleteJson(path: string): Promise<void> {
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  });
  await parseJson<unknown>(response);
}

export async function patchJson<T>(path: string, body: unknown): Promise<T> {
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

export { buildApiUrl, buildHeaders, getApiBaseUrl, parseJson };
