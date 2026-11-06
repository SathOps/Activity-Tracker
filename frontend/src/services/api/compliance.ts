import { getJson } from './client';
import type {
  UserProfileData,
  UserComplianceDetailResponse,
  UserCommitsResponse,
} from '../../types';
import { getMockComplianceProfile, getMockUserCommits } from '../mockData';

export async function getUserProfile(
  username: string
): Promise<UserProfileData> {
  try {
    return await getJson<UserProfileData>(
      `/compliance/users/${encodeURIComponent(username)}/profile`
    );
  } catch {
    return getMockComplianceProfile(username);
  }
}

export async function getUserComplianceDetail(
  username: string
): Promise<UserComplianceDetailResponse> {
  try {
    return await getJson<UserComplianceDetailResponse>(
      `/compliance/users/${encodeURIComponent(username)}`
    );
  } catch {
    return {
      profile: getMockComplianceProfile(username),
      commits: getMockUserCommits(username),
    };
  }
}

export async function getUserCommits(
  username: string,
  params?: { since?: string; until?: string; project_ids?: number[] }
): Promise<UserCommitsResponse> {
  try {
    const qs = new URLSearchParams();
    if (params?.since) qs.set('since', params.since);
    if (params?.until) qs.set('until', params.until);
    if (params?.project_ids?.length)
      qs.set('project_ids', params.project_ids.join(','));
    const query = qs.toString();
    return await getJson(
      `/compliance/users/${encodeURIComponent(username)}/commits${query ? `?${query}` : ''}`
    );
  } catch {
    return getMockUserCommits(username);
  }
}
