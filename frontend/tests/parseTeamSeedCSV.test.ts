import { expect, test } from 'vitest';

import {
  buildPreloadedTeams,
  parseTeamMembersCSV,
  parseTeamsCSV,
} from '../src/utils/parseTeamSeedCSV.ts';

test('parseTeamsCSV parses team rows and generates team ids when missing', () => {
  const csv = [
    'team_id,team_name',
    'alpha,Alpha Team',
    'alpha,Duplicate Alpha',
    ',Beta Team',
    '   ,   ',
  ].join('\n');

  const teams = parseTeamsCSV(csv);

  expect(teams).toEqual([
    { teamId: 'alpha', teamName: 'Alpha Team' },
    { teamId: 'beta-team', teamName: 'Beta Team' },
  ]);
});

test('parseTeamMembersCSV ignores empty rows and keeps valid seed rows', () => {
  const csv = [
    'team_id,intern_id,student_name',
    'alpha,intern_1,Alice',
    ',,',
    'beta,,Bob',
    ',intern_2,',
  ].join('\n');

  const rows = parseTeamMembersCSV(csv);

  expect(rows).toEqual([
    {
      teamId: 'alpha',
      teamName: undefined,
      internId: 'intern_1',
      studentName: 'Alice',
    },
    {
      teamId: 'beta',
      teamName: undefined,
      internId: undefined,
      studentName: 'Bob',
    },
  ]);
});

test('buildPreloadedTeams resolves interns by id or name and builds team structure', () => {
  const teamRows = parseTeamsCSV(
    ['team_id,team_name', 'alpha,Alpha Team'].join('\n')
  );
  const teamMemberRows = parseTeamMembersCSV(
    [
      'team_id,intern_id,student_name',
      'alpha,intern_1,Alice',
      'alpha,,Bob',
      'new team,intern_2,Bob',
      'alpha,intern_1,Duplicate',
      'ghost,,Unknown Person',
    ].join('\n')
  );

  const interns = [
    { id: 'intern_1', name: 'Alice' },
    { id: 'intern_2', name: 'Bob' },
  ];

  const teams = buildPreloadedTeams(teamRows, teamMemberRows, interns);

  expect(teams).toHaveLength(3);

  const alpha = teams.find((team) => team.teamId === 'alpha');
  expect(alpha).toBeTruthy();
  expect(alpha?.teamName).toBe('Alpha Team');
  expect(alpha?.interns.map((intern) => intern.internId)).toEqual([
    'intern_1',
    'intern_2',
  ]);

  const newTeam = teams.find((team) => team.teamId === 'new-team');
  expect(newTeam).toBeTruthy();
  expect(newTeam?.teamName).toBe('new team');
  expect(newTeam?.interns.map((intern) => intern.internId)).toEqual([
    'intern_2',
  ]);

  const ghostTeam = teams.find((team) => team.teamId === 'ghost');
  expect(ghostTeam).toBeTruthy();
  expect(ghostTeam?.interns).toEqual([]);
});
