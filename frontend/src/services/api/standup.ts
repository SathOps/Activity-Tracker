import { getJson } from './client';
import type { StandupWorkspaceResponse } from '../../types';
import { getMockStandupWorkspace } from '../mockData';

export async function getStandupWorkspace(): Promise<StandupWorkspaceResponse> {
  try {
    return await getJson<StandupWorkspaceResponse>('/standup');
  } catch {
    // Backend offline / running standalone on Vercel
    return getMockStandupWorkspace();
  }
}
