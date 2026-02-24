import { beforeEach, describe, expect, test } from "vitest";

import {
  addInternToTeam,
  createTeam,
  deleteTeam,
  getAllTeams,
  getTeamById,
  removeInternFromTeam,
  renameTeam,
  resetStore,
  seedMockData,
} from "./teamManager";

describe("teamManager", () => {
  beforeEach(() => {
    resetStore();
  });

  test("seedMockData clears existing teams", () => {
    createTeam("Temp Team");
    seedMockData();

    expect(getAllTeams()).toEqual([]);
  });

  test("createTeam creates a team with trimmed name and empty members", () => {
    const team = createTeam("  Gamma Force  ");

    expect(team.name).toBe("Gamma Force");
    expect(team.members).toEqual([]);
    expect(getAllTeams()).toHaveLength(1);
  });

  test("createTeam rejects empty names", () => {
    expect(() => createTeam("")).toThrow("Team name cannot be empty.");
    expect(() => createTeam("   ")).toThrow("Team name cannot be empty.");
  });

  test("renameTeam updates an existing team name", () => {
    const team = createTeam("Old Name");

    const renamed = renameTeam(team.id, " New Name ");

    expect(renamed.name).toBe("New Name");
    expect(getTeamById(team.id)?.name).toBe("New Name");
  });

  test("renameTeam validates unknown team and empty name", () => {
    const team = createTeam("Alpha");

    expect(() => renameTeam("missing-id", "Next")).toThrow("Team not found: missing-id");
    expect(() => renameTeam(team.id, "")).toThrow("New team name cannot be empty.");
  });

  test("addInternToTeam adds unique members and skips duplicates", () => {
    const team = createTeam("Alpha");

    addInternToTeam(team.id, "intern-301");
    addInternToTeam(team.id, "intern-301");

    expect(getTeamById(team.id)?.members).toEqual(["intern-301"]);
  });

  test("addInternToTeam validates unknown team", () => {
    expect(() => addInternToTeam("missing-id", "intern-301")).toThrow(
      "Team not found: missing-id"
    );
  });

  test("removeInternFromTeam removes member and validates errors", () => {
    const team = createTeam("Alpha");
    addInternToTeam(team.id, "intern-1");

    removeInternFromTeam(team.id, "intern-1");
    expect(getTeamById(team.id)?.members).toEqual([]);

    expect(() => removeInternFromTeam(team.id, "intern-999")).toThrow(
      `Intern "intern-999" is not a member of team "${team.id}".`
    );
    expect(() => removeInternFromTeam("missing-id", "intern-1")).toThrow(
      "Team not found: missing-id"
    );
  });

  test("deleteTeam removes a team and validates unknown id", () => {
    const team = createTeam("Alpha");

    deleteTeam(team.id);
    expect(getAllTeams()).toEqual([]);

    expect(() => deleteTeam("missing-id")).toThrow("Team not found: missing-id");
  });
});
