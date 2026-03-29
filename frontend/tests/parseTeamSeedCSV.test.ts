import { expect, test } from 'vite-plus/test';

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

test('parseTeamsCSV supports BOM headers and quoted values with commas', () => {
  const csv = [
    '\uFEFFTeam Name,Team ID',
    '"Alpha, Team",',
    '"  Beta ""Ace"" Squad  ",',
    'Gamma Team,gamma',
  ].join('\n');

  const teams = parseTeamsCSV(csv);

  expect(teams).toEqual([
    { teamId: 'alpha-team', teamName: 'Alpha, Team' },
    { teamId: 'beta-ace-squad', teamName: 'Beta "Ace" Squad' },
    { teamId: 'gamma', teamName: 'Gamma Team' },
  ]);
});

test('CSV parsers return empty arrays for header-only content and tolerate blank headers', () => {
  expect(parseTeamsCSV('team_id,team_name')).toEqual([]);
  expect(parseTeamMembersCSV('team_id,intern_id,student_name')).toEqual([]);
  expect(
    parseTeamsCSV(
      ['team_id,,team_name', 'alpha,,Alpha Team', 'beta'].join('\n')
    )
  ).toEqual([
    { teamId: 'alpha', teamName: 'Alpha Team' },
    { teamId: 'beta', teamName: 'beta' },
  ]);
});

test('parseTeamMembersCSV ignores empty rows and keeps valid seed rows', () => {
  const csv = [
    'team_id,team_name,intern_id,student_name',
    'alpha,,intern_1,Alice',
    ',,,',
    'beta,,,Bob',
    ',Beta Team,intern_2,',
    'ghost,,,',
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
    {
      teamId: undefined,
      teamName: 'Beta Team',
      internId: 'intern_2',
      studentName: undefined,
    },
  ]);
});

test('buildPreloadedTeams resolves members by team name and student-name-as-id lookups', () => {
  const teamRows = [
    { teamId: 'alpha', teamName: 'Alpha Team' },
    { teamId: 'alpha', teamName: 'Alpha Team Duplicate' },
  ];
  const interns = [
    { id: 'intern_1', name: 'Alice' },
    { id: 'intern_2', name: 'Bob' },
  ];

  const teams = buildPreloadedTeams(
    teamRows,
    [
      { teamName: 'Alpha Team', studentName: 'INTERN_2' },
      { teamName: 'Shadow Team', studentName: 'Alice' },
      { teamId: 'shadow_team', studentName: 'INTERN_2' },
      { studentName: 'Alice' },
    ],
    interns
  );

  expect(teams.find((team) => team.teamId === 'alpha')?.interns).toEqual([
    {
      internId: 'intern_2',
      corpusUserId: 'intern_2',
      internName: 'Bob',
      status: 'PENDING',
      todayValidCount: 0,
    },
  ]);
  expect(teams.find((team) => team.teamId === 'shadow-team')?.interns).toEqual([
    {
      internId: 'intern_1',
      corpusUserId: 'intern_1',
      internName: 'Alice',
      status: 'PENDING',
      todayValidCount: 0,
    },
    {
      internId: 'intern_2',
      corpusUserId: 'intern_2',
      internName: 'Bob',
      status: 'PENDING',
      todayValidCount: 0,
    },
  ]);
  expect(teams.find((team) => team.teamId === '')).toBeUndefined();
});

test('buildPreloadedTeams falls back to member-provided names and ids when intern names are blank', () => {
  const teams = buildPreloadedTeams(
    [],
    [
      { teamId: 'alpha', internId: 'intern_1', studentName: 'Alias Name' },
      { teamId: 'beta', internId: 'intern_2' },
      { teamId: 'beta', internId: 'intern_1', studentName: 'Second Beta' },
      { teamId: 'alpha', internId: 'intern_1', studentName: 'Duplicate' },
      { teamId: 'alpha', internId: 'missing-user', studentName: 'Ghost' },
    ],
    [
      { id: 'intern_1', name: '' },
      { id: 'intern_2', name: '' },
    ]
  );

  expect(teams.find((team) => team.teamId === 'alpha')?.teamName).toBe('alpha');
  expect(teams.find((team) => team.teamId === 'beta')?.teamName).toBe('beta');
  expect(teams.find((team) => team.teamId === 'alpha')?.interns).toEqual([
    {
      internId: 'intern_1',
      corpusUserId: 'intern_1',
      internName: 'Alias Name',
      status: 'PENDING',
      todayValidCount: 0,
    },
  ]);
  expect(teams.find((team) => team.teamId === 'beta')?.interns).toEqual([
    {
      internId: 'intern_2',
      corpusUserId: 'intern_2',
      internName: 'intern_2',
      status: 'PENDING',
      todayValidCount: 0,
    },
    {
      internId: 'intern_1',
      corpusUserId: 'intern_1',
      internName: 'Second Beta',
      status: 'PENDING',
      todayValidCount: 0,
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
