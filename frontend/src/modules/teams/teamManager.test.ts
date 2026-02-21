// ─────────────────────────────────────────────────
//  teamManager — Smoke Test Script
// ─────────────────────────────────────────────────

import {
    createTeam,
    renameTeam,
    deleteTeam,
    addInternToTeam,
    removeInternFromTeam,
    getAllTeams,
    getTeamById,
    resetStore,
    seedMockData,
} from "./teamManager";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`❌ ASSERTION FAILED: ${message}`);
    }
}

function expectThrow(fn: () => void, message: string): void {
    let threw = false;
    try {
        fn();
    } catch {
        threw = true;
    }
    assert(threw, message);
}

// ── Start fresh ──
resetStore();

// ── Test: seedMockData ──
seedMockData();
assert(getAllTeams().length === 0, "seedMockData should not prefill teams");
console.log("✅ seedMockData keeps store empty");

// ── Test: createTeam ──
resetStore();
const team = createTeam("Gamma Force");
assert(team.name === "Gamma Force", "createTeam should set the name");
assert(team.members.length === 0, "createTeam should start with no members");
assert(getAllTeams().length === 1, "store should have 1 team after create");
console.log("✅ createTeam works");

// ── Test: createTeam validation ──
expectThrow(() => createTeam(""), "createTeam should throw on empty name");
expectThrow(() => createTeam("   "), "createTeam should throw on blank name");
console.log("✅ createTeam validation works");

// ── Test: renameTeam ──
const renamed = renameTeam(team.id, "Delta Force");
assert(renamed.name === "Delta Force", "renameTeam should update the name");
assert(
    getTeamById(team.id)?.name === "Delta Force",
    "store should reflect rename"
);
console.log("✅ renameTeam works");

// ── Test: renameTeam validation ──
expectThrow(
    () => renameTeam("nonexistent", "X"),
    "renameTeam should throw for unknown teamId"
);
expectThrow(
    () => renameTeam(team.id, ""),
    "renameTeam should throw on empty new name"
);
console.log("✅ renameTeam validation works");

// ── Test: addInternToTeam ──
const withIntern = addInternToTeam(team.id, "intern-301");
assert(withIntern.members.length === 1, "team should have 1 member");
assert(
    withIntern.members.includes("intern-301"),
    "team should include intern-301"
);

// Duplicate add is a no-op
const sameTeam = addInternToTeam(team.id, "intern-301");
assert(
    sameTeam.members.length === 1,
    "duplicate add should not increase member count"
);
console.log("✅ addInternToTeam works (including duplicate no-op)");

// ── Test: addInternToTeam validation ──
expectThrow(
    () => addInternToTeam("nonexistent", "intern-301"),
    "addInternToTeam should throw for unknown teamId"
);
console.log("✅ addInternToTeam validation works");

// ── Test: removeInternFromTeam ──
const afterRemove = removeInternFromTeam(team.id, "intern-301");
assert(afterRemove.members.length === 0, "team should have 0 members after removal");
console.log("✅ removeInternFromTeam works");

// ── Test: removeInternFromTeam validation ──
expectThrow(
    () => removeInternFromTeam(team.id, "intern-999"),
    "removeInternFromTeam should throw for non-member intern"
);
expectThrow(
    () => removeInternFromTeam("nonexistent", "intern-301"),
    "removeInternFromTeam should throw for unknown teamId"
);
console.log("✅ removeInternFromTeam validation works");

// ── Test: deleteTeam ──
deleteTeam(team.id);
assert(getAllTeams().length === 0, "store should be empty after delete");
console.log("✅ deleteTeam works");

// ── Test: deleteTeam validation ──
expectThrow(
    () => deleteTeam("nonexistent"),
    "deleteTeam should throw for unknown teamId"
);
console.log("✅ deleteTeam validation works");

console.log("\n🎉 All tests passed!");
