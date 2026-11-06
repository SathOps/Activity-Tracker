import { getJson, postJson } from './client';
import type { Team, TeamResult } from '../../types';
import { getMockLeaderboardTeams, getMockLeaderboardResults } from '../mockData';

export async function analyzeTeams(
  teams: Team[],
  since?: string,
  until?: string
): Promise<TeamResult[]> {
  try {
    const payload = await postJson<{ teams: TeamResult[] }>(
      '/leaderboard/analyze',
      { teams, since, until }
    );
    return payload.teams;
  } catch {
    return getMockLeaderboardResults(teams);
  }
}

export async function getTeams(): Promise<Team[]> {
  try {
    const payload = await getJson<{ teams: Team[] }>('/leaderboard/teams');
    return payload.teams;
  } catch {
    return getMockLeaderboardTeams();
  }
}
