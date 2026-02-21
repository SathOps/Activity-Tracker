// ─────────────────────────────────────────────────
//  Team Manager — Pure Logic API for Team Operations
// ─────────────────────────────────────────────────

import {
    Team,
    getTeamById,
    setTeam,
    deleteTeamById,
    getAllTeams,
    resetStore,
    seedMockData,
} from "../../store/teamStore";

// Re-export store utilities so consumers can import everything from one place.
export { getAllTeams, getTeamById, resetStore, seedMockData };
export type { Team };

// ── Helpers ─────────────────────────────────────

/** Generate a simple unique ID (no external dependency). */
function generateId(): string {
    return `team-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
}

// ── Public API ──────────────────────────────────

/**
 * Create a new team with the given name.
 * @returns The newly created Team object.
 */
export function createTeam(name: string): Team {
    if (!name || name.trim().length === 0) {
        throw new Error("Team name cannot be empty.");
    }

    const team: Team = {
        id: generateId(),
        name: name.trim(),
        members: [],
    };

    setTeam(team);
    return team;
}

/**
 * Rename an existing team.
 * @throws If the team is not found or the new name is empty.
 * @returns The updated Team object.
 */
export function renameTeam(teamId: string, newName: string): Team {
    const team = getTeamById(teamId);
    if (!team) {
        throw new Error(`Team not found: ${teamId}`);
    }
    if (!newName || newName.trim().length === 0) {
        throw new Error("New team name cannot be empty.");
    }

    team.name = newName.trim();
    setTeam(team);
    return team;
}

/**
 * Delete a team by ID.
 * @throws If the team is not found.
 */
export function deleteTeam(teamId: string): void {
    const existed = deleteTeamById(teamId);
    if (!existed) {
        throw new Error(`Team not found: ${teamId}`);
    }
}

/**
 * Add an intern to a team.
 * If the intern is already a member, this is a no-op.
 * @throws If the team is not found.
 * @returns The updated Team object.
 */
export function addInternToTeam(teamId: string, internId: string): Team {
    const team = getTeamById(teamId);
    if (!team) {
        throw new Error(`Team not found: ${teamId}`);
    }

    if (!team.members.includes(internId)) {
        team.members.push(internId);
        setTeam(team);
    }

    return team;
}

/**
 * Remove an intern from a team.
 * @throws If the team is not found or the intern is not a member.
 * @returns The updated Team object.
 */
export function removeInternFromTeam(teamId: string, internId: string): Team {
    const team = getTeamById(teamId);
    if (!team) {
        throw new Error(`Team not found: ${teamId}`);
    }

    const index = team.members.indexOf(internId);
    if (index === -1) {
        throw new Error(
            `Intern "${internId}" is not a member of team "${teamId}".`
        );
    }

    team.members.splice(index, 1);
    setTeam(team);
    return team;
}
