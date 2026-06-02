import { getJson, patchJson } from './client';
import type { MyProfileResponse, MyTeamResponse } from '../../types';

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

export async function getMyTeam(): Promise<MyTeamResponse> {
  return getJson<MyTeamResponse>('/me/team');
}
