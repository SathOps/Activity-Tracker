import { getJson } from './client';
import type { StandupWorkspaceResponse } from '../../types';

export async function getStandupWorkspace(): Promise<StandupWorkspaceResponse> {
  return getJson<StandupWorkspaceResponse>('/standup');
}
