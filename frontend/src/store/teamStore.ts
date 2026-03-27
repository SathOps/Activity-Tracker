// ─────────────────────────────────────────────
//  Team Store — In-Memory State for Team Data
// ─────────────────────────────────────────────

/**
 * Represents a team of interns.
 */
export interface Team {
  id: string;
  name: string;
  members: string[]; // intern IDs only
}

// ── Internal state ──────────────────────────
const teamMap: Map<string, Team> = new Map();

// ── Store API ───────────────────────────────

/** Retrieve all teams as an array. */
export function getAllTeams(): Team[] {
  return Array.from(teamMap.values());
}

/** Retrieve a single team by ID, or `undefined` if not found. */
export function getTeamById(teamId: string): Team | undefined {
  return teamMap.get(teamId);
}

/** Insert or update a team in the store. */
export function setTeam(team: Team): void {
  teamMap.set(team.id, team);
}

/** Remove a team from the store by ID. Returns `true` if the team existed. */
export function deleteTeamById(teamId: string): boolean {
  return teamMap.delete(teamId);
}

/** Clear all teams from the store. Useful for testing and resets. */
export function resetStore(): void {
  teamMap.clear();
}

// ── Seed Hook (No Default Data) ─────────────

/** Keeps compatibility for callers that expect a seeding hook. */
export function seedMockData(): void {
  resetStore();
}
