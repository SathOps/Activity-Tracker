import {
  getJson,
  postJson,
  deleteJson,
  patchJson,
  buildApiUrl,
  buildHeaders,
  parseJson,
} from './client';
import type { UserRecord } from '../../types';

export async function getUsers(): Promise<UserRecord[]> {
  const payload = await getJson<{ users: UserRecord[] }>('/users/');
  return payload.users;
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

export async function searchUsers(query: string): Promise<UserRecord[]> {
  const payload = await getJson<{ users: UserRecord[] }>(
    `/users/?q=${encodeURIComponent(query)}`
  );
  return payload.users;
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

export async function deleteUser(userId: number): Promise<void> {
  return deleteJson(`/users/${userId}`);
}

export async function assignUserRole(
  userId: number,
  role: string
): Promise<UserRecord> {
  return patchJson(`/users/${userId}`, { role });
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
