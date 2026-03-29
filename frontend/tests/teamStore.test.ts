import { beforeEach, describe, expect, test } from 'vite-plus/test';

import {
  deleteTeamById,
  getAllTeams,
  getTeamById,
  resetStore,
  seedMockData,
  setTeam,
  type Team,
} from '../src/store/teamStore.ts';

describe('teamStore', () => {
  const alphaTeam: Team = {
    id: 'team-1',
    name: 'Alpha Team',
    members: ['intern-1'],
  };

  beforeEach(() => {
    resetStore();
  });

  test('setTeam stores and updates a team', () => {
    setTeam(alphaTeam);
    expect(getTeamById('team-1')).toEqual(alphaTeam);

    setTeam({ ...alphaTeam, name: 'Renamed Alpha', members: [] });
    expect(getTeamById('team-1')).toEqual({
      id: 'team-1',
      name: 'Renamed Alpha',
      members: [],
    });
  });

  test('getAllTeams returns all stored teams', () => {
    setTeam(alphaTeam);
    setTeam({ id: 'team-2', name: 'Beta Team', members: [] });

    const allTeams = getAllTeams();
    expect(allTeams).toHaveLength(2);
    expect(allTeams.map((team) => team.id)).toEqual(['team-1', 'team-2']);
  });

  test('deleteTeamById returns true when team exists, false otherwise', () => {
    setTeam(alphaTeam);

    expect(deleteTeamById('team-1')).toBe(true);
    expect(deleteTeamById('team-1')).toBe(false);
  });

  test('seedMockData clears all teams', () => {
    setTeam(alphaTeam);
    seedMockData();

    expect(getAllTeams()).toEqual([]);
  });
});
