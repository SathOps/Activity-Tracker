import { getJson, postJson } from './client';
import type { Team, TeamResult } from '../../types';

export async function analyzeTeams(
  teams: Team[],
  since?: string,
  until?: string
): Promise<TeamResult[]> {
  const payload = await postJson<{ teams: TeamResult[] }>(
    '/leaderboard/analyze',
    { teams, since, until }
  );
  return payload.teams;
}

export async function getTeams(): Promise<Team[]> {
  const payload = await getJson<{ teams: Team[] }>('/leaderboard/teams');
  return payload.teams;
}
