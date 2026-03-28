import type { Team } from '../components/dashboard/TeamList';
import type { Intern } from '../components/intern/InternSearch';

interface TeamSeedRow {
  teamId: string;
  teamName: string;
}

interface TeamMemberSeedRow {
  teamId?: string;
  teamName?: string;
  internId?: string;
  studentName?: string;
}

type CsvRecord = Record<string, string>;

export function parseTeamsCSV(csvText: string): TeamSeedRow[] {
  const records = parseCsvRecords(csvText);
  const rows: TeamSeedRow[] = [];
  const seenTeamIds = new Set<string>();

  for (const record of records) {
    const teamName = sanitizeCell(record.team_name || record.teamname);
    const teamId =
      sanitizeCell(record.team_id || record.teamid) ||
      normalizeIdentifier(teamName);
    const resolvedTeamName = teamName || teamId;

    if (!teamId || seenTeamIds.has(teamId)) {
      continue;
    }

    seenTeamIds.add(teamId);
    rows.push({ teamId, teamName: resolvedTeamName });
  }

  return rows;
}

export function parseTeamMembersCSV(csvText: string): TeamMemberSeedRow[] {
  const records = parseCsvRecords(csvText);
  const rows: TeamMemberSeedRow[] = [];

  for (const record of records) {
    const teamId = sanitizeCell(record.team_id || record.teamid);
    const teamName = sanitizeCell(record.team_name || record.teamname);
    const internId = sanitizeCell(record.intern_id || record.internid);
    const studentName = sanitizeCell(record.student_name || record.studentname);

    if ((!teamId && !teamName) || (!internId && !studentName)) {
      continue;
    }

    rows.push({
      teamId: teamId.length > 0 ? teamId : undefined,
      teamName: teamName.length > 0 ? teamName : undefined,
      internId: internId.length > 0 ? internId : undefined,
      studentName: studentName.length > 0 ? studentName : undefined,
    });
  }

  return rows;
}

export function buildPreloadedTeams(
  teamRows: TeamSeedRow[],
  teamMemberRows: TeamMemberSeedRow[],
  interns: Intern[]
): Team[] {
  const teamNameById = new Map<string, string>();
  const teamIdByNormalizedName = new Map<string, string>();

  for (const teamRow of teamRows) {
    if (!teamNameById.has(teamRow.teamId)) {
      teamNameById.set(teamRow.teamId, teamRow.teamName);
    }

    teamIdByNormalizedName.set(
      normalizeLookupKey(teamRow.teamName),
      teamRow.teamId
    );
  }

  const internsById = new Map(interns.map((intern) => [intern.id, intern]));
  const internsByName = new Map(
    interns.map((intern) => [normalizeLookupKey(intern.name), intern])
  );
  const internsByIdLookup = new Map(
    interns.map((intern) => [normalizeLookupKey(intern.id), intern])
  );
  const teamInternsById = new Map<string, Team['interns']>();

  for (const member of teamMemberRows) {
    const resolvedTeamId = resolveTeamId(
      member,
      teamNameById,
      teamIdByNormalizedName
    );

    if (!resolvedTeamId) {
      continue;
    }

    const resolvedIntern =
      (member.internId && internsById.get(member.internId)) ||
      (member.studentName &&
        internsByName.get(normalizeLookupKey(member.studentName))) ||
      (member.studentName &&
        internsByIdLookup.get(normalizeLookupKey(member.studentName)));

    if (!resolvedIntern) {
      continue;
    }

    const teamInterns = teamInternsById.get(resolvedTeamId) ?? [];

    if (teamInterns.some((intern) => intern.internId === resolvedIntern.id)) {
      continue;
    }

    teamInterns.push({
      internId: resolvedIntern.id,
      corpusUserId: resolvedIntern.id,
      internName: resolveInternDisplayName(resolvedIntern, member.studentName),
      status: 'PENDING',
      todayValidCount: 0,
    });

    teamInternsById.set(resolvedTeamId, teamInterns);
  }

  const teams: Team[] = Array.from(teamNameById.entries()).map(
    ([teamId, teamName]) => ({
      teamId,
      teamName,
      interns: teamInternsById.get(teamId) ?? [],
      teamStatus: 'PENDING',
      todayStandupCount: 0,
      requiredStandupCount: 4,
    })
  );

  return teams;
}

function parseCsvRecords(csvText: string): CsvRecord[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) =>
    normalizeHeaderName(header)
  );
  const records: CsvRecord[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index]);

    if (values.every((value) => sanitizeCell(value).length === 0)) {
      continue;
    }

    const record: CsvRecord = {};

    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      const header = headers[headerIndex];
      if (!header) {
        continue;
      }
      record[header] = sanitizeCell(values[headerIndex] ?? '');
    }

    records.push(record);
  }

  return records;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function sanitizeCell(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function normalizeHeaderName(value: string): string {
  return sanitizeCell(value)
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function normalizeLookupKey(value: string): string {
  return sanitizeCell(value).toLowerCase();
}

function resolveTeamId(
  member: TeamMemberSeedRow,
  teamNameById: Map<string, string>,
  teamIdByNormalizedName: Map<string, string>
): string {
  if (member.teamId && teamNameById.has(member.teamId)) {
    return member.teamId;
  }

  if (member.teamName) {
    const mappedTeamId = teamIdByNormalizedName.get(
      normalizeLookupKey(member.teamName)
    );

    if (mappedTeamId) {
      return mappedTeamId;
    }
  }

  const generatedTeamId = normalizeIdentifier(
    member.teamId || member.teamName || ''
  );

  if (!generatedTeamId) {
    return '';
  }

  if (!teamNameById.has(generatedTeamId)) {
    let resolvedTeamNameSource = generatedTeamId;

    if (member.teamId) {
      resolvedTeamNameSource = member.teamId;
    }

    if (member.teamName) {
      resolvedTeamNameSource = member.teamName;
    }

    const resolvedTeamName = sanitizeCell(resolvedTeamNameSource);
    teamNameById.set(generatedTeamId, resolvedTeamName);
    teamIdByNormalizedName.set(
      normalizeLookupKey(resolvedTeamName),
      generatedTeamId
    );
  }

  return generatedTeamId;
}

function resolveInternDisplayName(
  intern: Intern,
  fallbackStudentName: string | undefined
): string {
  const trimmedName = intern.name.trim();

  if (trimmedName) {
    return trimmedName;
  }

  if (fallbackStudentName) {
    return fallbackStudentName;
  }

  return intern.id;
}

function normalizeIdentifier(value: string): string {
  return sanitizeCell(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
