import { getJson } from './client';
import type {
  UserProfileData,
  UserComplianceDetailResponse,
  UserCommitsResponse,
} from '../../types';

export async function getUserProfile(
  username: string
): Promise<UserProfileData> {
  return getJson<UserProfileData>(
    `/compliance/users/${encodeURIComponent(username)}/profile`
  );
}

export async function getUserComplianceDetail(
  username: string
): Promise<UserComplianceDetailResponse> {
  return getJson<UserComplianceDetailResponse>(
    `/compliance/users/${encodeURIComponent(username)}`
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
