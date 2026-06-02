import { getJson, postJson, deleteJson, patchJson } from './client';
import type { TeamRecord, TeamDetailRecord, UserRecord } from '../../types';

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
