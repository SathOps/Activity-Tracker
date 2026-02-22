import React from "react";
import TeamList, { Team } from "./TeamList";
import InternCard from "../intern/InternCard";
import type { Intern } from "../intern/InternSearch";
import { verifyStandupSubmission } from "../../utils/verification";

type DashboardView = "TEAMS" | "INTERNS" | "COMPLETED";

export interface DashboardLayoutProps {
  teams?: Team[];
  addedInterns?: Intern[];
  title?: string;
}

const DEFAULT_VIEW: DashboardView = "TEAMS";
const EMPTY_TEAMS: Team[] = [];
const REQUIRED_TEAM_STANDUPS = 4;
const REQUIRED_CATEGORY_UUID_ALIASES = [
  "c81f5d73-9090-453e-bb08-c2f46453e0bd",
  "4dd053f4-6323-43d4-87a3-ce1816bd9459",
];
const STANDUP_ALIAS_OVERRIDE = mergeAliases(
  ["Stand-Up", ...REQUIRED_CATEGORY_UUID_ALIASES],
  parseAliasEnv(import.meta.env.VITE_STANDUP_LABEL_ALIASES)
);
const INTERNSHIP_ALIAS_OVERRIDE = mergeAliases(
  ["Internship", ...REQUIRED_CATEGORY_UUID_ALIASES],
  parseAliasEnv(import.meta.env.VITE_INTERNSHIP_LABEL_ALIASES)
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  teams,
  addedInterns,
  title = "Team-wise Standup Submission Dashboard",
}) => {
  const [managedTeams, setManagedTeams] = React.useState<Team[]>(() => teams ?? EMPTY_TEAMS);
  const [selectedDateKey, setSelectedDateKey] = React.useState(() => getLocalDateKey(new Date()));
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreatingTeam, setIsCreatingTeam] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [activeView, setActiveView] = React.useState<DashboardView>(DEFAULT_VIEW);
  const [hoveredBox, setHoveredBox] = React.useState<DashboardView | null>(null);
  const [verifyingTeamId, setVerifyingTeamId] = React.useState<string | null>(null);
  const hasInitializedDateSelection = React.useRef(false);

  React.useEffect(() => {
    if (teams) {
      setManagedTeams(teams);
    }
  }, [teams]);

  React.useEffect(() => {
    if (!hasInitializedDateSelection.current) {
      hasInitializedDateSelection.current = true;
      return;
    }

    setManagedTeams((prev) => prev.map((team) => resetTeamVerification(team)));
  }, [selectedDateKey]);

  const totalTeams = managedTeams.length;
  const allInternRows = React.useMemo(
    () =>
      managedTeams.flatMap((team) =>
        team.interns.map((intern) => ({
          ...intern,
          teamId: team.teamId,
          teamName: team.teamName,
        }))
      ),
    [managedTeams]
  );
  const totalInterns = allInternRows.length;
  const completedCount = allInternRows.filter((intern) => intern.status === "COMPLETED").length;
  const selectedDateLabel = React.useMemo(
    () => formatDateForDisplay(selectedDateKey),
    [selectedDateKey]
  );

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filteredTeams = React.useMemo(() => {
    if (!normalizedQuery) {
      return managedTeams;
    }

    return managedTeams.filter((team) => team.teamName.toLowerCase().includes(normalizedQuery));
  }, [managedTeams, normalizedQuery]);

  const filteredInternRows = React.useMemo(() => {
    const source =
      activeView === "COMPLETED"
        ? allInternRows.filter((intern) => intern.status === "COMPLETED")
        : allInternRows;

    if (!normalizedQuery) {
      return source;
    }

    return source.filter(
      (intern) =>
        (intern.internName ?? "").toLowerCase().includes(normalizedQuery) ||
        intern.teamName.toLowerCase().includes(normalizedQuery)
    );
  }, [activeView, allInternRows, normalizedQuery]);

  const handleCreateTeam = () => {
    const teamName = newTeamName.trim();

    if (!teamName) {
      return;
    }

    setManagedTeams((prev) => [
      ...prev,
      {
        teamId: buildTeamId(teamName, prev),
        teamName,
        interns: [],
        teamStatus: "PENDING",
        todayStandupCount: 0,
        requiredStandupCount: REQUIRED_TEAM_STANDUPS,
      },
    ]);

    setNewTeamName("");
    setIsCreatingTeam(false);
  };

  const handleAddInternToTeam = (teamId: string, intern: Intern) => {
    const trimmedName = intern.name.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) => {
        if (team.teamId !== teamId) {
          return team;
        }

        const duplicateExists = team.interns.some(
          (existingIntern) =>
            existingIntern.corpusUserId === intern.id || existingIntern.internId === intern.id
        );

        if (duplicateExists) {
          return team;
        }

        return {
          ...team,
          teamStatus: "PENDING",
          todayStandupCount: 0,
          verifiedDate: undefined,
          requiredStandupCount: REQUIRED_TEAM_STANDUPS,
          interns: [
            ...team.interns,
            {
              internId: intern.id,
              corpusUserId: intern.id,
              internName: trimmedName,
              status: "PENDING",
              todayValidCount: 0,
            },
          ],
        };
      })
    );
  };

  const handleVerifyTeam = async (teamId: string) => {
    const team = managedTeams.find((candidateTeam) => candidateTeam.teamId === teamId);

    if (!team || team.interns.length === 0) {
      return;
    }

    const verificationDateKey = selectedDateKey;
    setVerifyingTeamId(teamId);

    try {
      const verificationResults = await Promise.all(
        team.interns.map(async (intern) => {
          const corpusUserId = intern.corpusUserId || intern.internId;

          try {
            return await verifyStandupSubmission(corpusUserId, {
              uploadedOnDate: verificationDateKey,
              standupAliases: STANDUP_ALIAS_OVERRIDE,
              internshipAliases: INTERNSHIP_ALIAS_OVERRIDE,
            });
          } catch (error) {
            console.error(
              `Team verification failed for user "${corpusUserId}" (${teamId})`,
              error
            );

            return {
              internId: corpusUserId,
              validCount: 0,
              status: "PENDING" as const,
              checkedDate: verificationDateKey,
            };
          }
        })
      );

      const countByInternId = new Map(
        verificationResults.map((result) => [result.internId, result.validCount])
      );
      const teamTodayStandupCount = verificationResults.reduce(
        (total, result) => total + result.validCount,
        0
      );

      setManagedTeams((prev) =>
        prev.map((candidateTeam) => {
          if (candidateTeam.teamId !== teamId) {
            return candidateTeam;
          }

          return {
            ...candidateTeam,
            teamStatus:
              teamTodayStandupCount >= REQUIRED_TEAM_STANDUPS ? "COMPLETED" : "PENDING",
            todayStandupCount: teamTodayStandupCount,
            verifiedDate: verificationDateKey,
            requiredStandupCount: REQUIRED_TEAM_STANDUPS,
            interns: candidateTeam.interns.map((intern) => {
              const corpusUserId = intern.corpusUserId || intern.internId;
              const todayValidCount = countByInternId.get(corpusUserId) ?? 0;

              return {
                ...intern,
                todayValidCount,
                status: todayValidCount > 0 ? "COMPLETED" : "PENDING",
              };
            }),
          };
        })
      );
    } finally {
      setVerifyingTeamId(null);
    }
  };

  const handleVerifySubmission = (internId: string) => {
    const team = managedTeams.find((candidateTeam) =>
      candidateTeam.interns.some((intern) => intern.internId === internId)
    );

    if (!team) {
      return;
    }

    void handleVerifyTeam(team.teamId);
  };

  const handleDeleteIntern = (internId: string) => {
    setManagedTeams((prev) =>
      prev.map((team) => {
        if (!team.interns.some((intern) => intern.internId === internId)) {
          return team;
        }

        return {
          ...team,
          teamStatus: "PENDING",
          todayStandupCount: 0,
          verifiedDate: undefined,
          requiredStandupCount: REQUIRED_TEAM_STANDUPS,
          interns: team.interns.filter((intern) => intern.internId !== internId),
        };
      })
    );
  };

  const handleUpdateIntern = (internId: string, newName: string) => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) => ({
        ...team,
        interns: team.interns.map((intern) =>
          intern.internId === internId ? { ...intern, internName: trimmedName } : intern
        ),
      }))
    );
  };

  const handleDeleteTeam = (teamId: string) => {
    setManagedTeams((prev) => prev.filter((team) => team.teamId !== teamId));
  };

  const handleSelectedDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDateKey = event.target.value;

    if (!nextDateKey) {
      return;
    }

    setSelectedDateKey(nextDateKey);
  };

  const handleUpdateTeamName = (teamId: string, newName: string) => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) => (team.teamId === teamId ? { ...team, teamName: trimmedName } : team))
    );
  };

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">{title}</h1>
        <button
          className="primary-button"
          onClick={() => setIsCreatingTeam((prev) => !prev)}
          type="button"
        >
          {isCreatingTeam ? "Cancel" : "Create Team"}
        </button>
      </header>

      <section
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          marginBottom: 14,
        }}
      >
        {[
          { key: "TEAMS" as const, label: "Teams", value: totalTeams },
          { key: "INTERNS" as const, label: "Interns", value: totalInterns },
          { key: "COMPLETED" as const, label: "Completed", value: completedCount },
        ].map((item) => {
          const isActive = activeView === item.key;
          const isHovered = hoveredBox === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              onMouseEnter={() => setHoveredBox(item.key)}
              onMouseLeave={() => setHoveredBox(null)}
              style={{
                backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                border: "1px solid #bfdbfe",
                borderRadius: 12,
                boxShadow: isActive || isHovered ? "0 0 0 3px rgba(147, 197, 253, 0.35)" : "none",
                cursor: "pointer",
                minHeight: 110,
                padding: "14px 16px",
                textAlign: "left",
                transition: "box-shadow 180ms ease, background-color 180ms ease",
              }}
              type="button"
            >
              <div style={{ color: "#1d4ed8", fontSize: 14, marginBottom: 8 }}>{item.label}</div>
              <strong style={{ color: "#0f172a", fontSize: 34, lineHeight: 1 }}>{item.value}</strong>
            </button>
          );
        })}
      </section>

      {isCreatingTeam ? (
        <section
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <input
            aria-label="New team name"
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Enter team name"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              minWidth: 260,
              padding: "8px 10px",
            }}
            type="text"
            value={newTeamName}
          />
          <button className="secondary-button" onClick={handleCreateTeam} type="button">
            Add Team
          </button>
        </section>
      ) : null}

      <section style={{ marginBottom: 16 }}>
        <label
          style={{
            color: "#374151",
            display: "grid",
            fontSize: 13,
            gap: 6,
            maxWidth: 280,
          }}
        >
          <span>Standup verification date</span>
          <input
            aria-label="Standup verification date"
            onChange={handleSelectedDateChange}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              padding: "10px 12px",
            }}
            type="date"
            value={selectedDateKey}
          />
        </label>
      </section>

      <section style={{ marginBottom: 16 }}>
        <input
          aria-label="Search"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={
            activeView === "TEAMS"
              ? "Search by team name..."
              : "Search by intern name or team name..."
          }
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            padding: "10px 12px",
            width: "100%",
          }}
          type="text"
          value={searchTerm}
        />
      </section>

      {activeView === "TEAMS" ? (
        <TeamList
          addedInterns={addedInterns}
          onAddInternToTeam={handleAddInternToTeam}
          onDeleteIntern={handleDeleteIntern}
          onDeleteTeam={handleDeleteTeam}
          onUpdateIntern={handleUpdateIntern}
          onUpdateTeamName={handleUpdateTeamName}
          onVerifySubmission={handleVerifySubmission}
          onVerifyTeam={(teamId) => {
            void handleVerifyTeam(teamId);
          }}
          selectedDateLabel={selectedDateLabel}
          verifyingTeamId={verifyingTeamId}
          teams={filteredTeams}
        />
      ) : null}

      {activeView !== "TEAMS" ? (
        <section className="team-list">
          {filteredInternRows.length === 0 ? (
            <p className="team-empty">
              {activeView === "COMPLETED"
                ? "No completed interns found."
                : "No interns found for the current search."}
            </p>
          ) : (
            filteredInternRows.map((intern) => (
              <article className="team-card" key={intern.internId}>
                <header className="team-header">
                  <div>
                    <h3 className="team-name">{intern.teamName}</h3>
                  </div>
                </header>
                <InternCard
                  internId={intern.internId}
                  internName={intern.internName}
                  onDeleteIntern={handleDeleteIntern}
                  onUpdateIntern={handleUpdateIntern}
                  onVerifySubmission={handleVerifySubmission}
                  status={intern.status}
                  standupDateLabel={selectedDateLabel}
                  todayValidCount={intern.todayValidCount}
                />
              </article>
            ))
          )}
        </section>
      ) : null}
    </main>
  );
};

function buildTeamId(teamName: string, existingTeams: Team[]): string {
  const base = normalizeIdentifier(teamName) || "team";
  const existingIds = new Set(existingTeams.map((team) => team.teamId));
  let candidate = base;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseAliasEnv(rawAliases: string | undefined): string[] | undefined {
  if (!rawAliases) {
    return undefined;
  }

  const aliases = rawAliases
    .split(/[|,;/]+/g)
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);

  if (aliases.length === 0) {
    return undefined;
  }

  return Array.from(new Set(aliases));
}

function mergeAliases(baseAliases: string[], extraAliases: string[] | undefined): string[] {
  return Array.from(new Set([...(baseAliases ?? []), ...(extraAliases ?? [])]));
}

function resetTeamVerification(team: Team): Team {
  return {
    ...team,
    teamStatus: "PENDING",
    todayStandupCount: 0,
    verifiedDate: undefined,
    requiredStandupCount: REQUIRED_TEAM_STANDUPS,
    interns: team.interns.map((intern) => ({
      ...intern,
      status: "PENDING",
      todayValidCount: 0,
    })),
  };
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateKey: string): string {
  const parsedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

export default DashboardLayout;
