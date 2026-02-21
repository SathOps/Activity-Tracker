import React from "react";
import TeamList, { Team } from "./TeamList";
import InternCard from "../intern/InternCard";
import type { Intern } from "../intern/InternSearch";

type DashboardView = "TEAMS" | "INTERNS" | "COMPLETED";

export interface DashboardLayoutProps {
  teams?: Team[];
  addedInterns?: Intern[];
  onCreateTeam?: () => void;
  onAddInternToTeam?: (teamId: string) => void;
  onVerifySubmission?: (internId: string) => void;
  title?: string;
  verifyStandupSubmission?: (internId: string) => void;
  createTeam?: (teamName: string) => void;
  addInternToTeam?: (teamId: string, internName: string) => void;
  deleteIntern?: (internId: string) => void;
  updateIntern?: (internId: string, newName: string) => void;
  deleteTeam?: (teamId: string) => void;
  updateTeamName?: (teamId: string, newName: string) => void;
}

const DEFAULT_VIEW: DashboardView = "TEAMS";
const EMPTY_TEAMS: Team[] = [];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  teams = EMPTY_TEAMS,
  addedInterns,
  onCreateTeam,
  onAddInternToTeam,
  onVerifySubmission,
  verifyStandupSubmission,
  createTeam,
  addInternToTeam,
  deleteIntern,
  updateIntern,
  deleteTeam,
  updateTeamName,
  title = "Team-wise Standup Submission Dashboard",
}) => {
  const [managedTeams, setManagedTeams] = React.useState<Team[]>(() => teams ?? EMPTY_TEAMS);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreatingTeam, setIsCreatingTeam] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [activeView, setActiveView] = React.useState<DashboardView>(DEFAULT_VIEW);
  const [hoveredBox, setHoveredBox] = React.useState<DashboardView | null>(null);

  React.useEffect(() => {
    if (teams) {
      setManagedTeams(teams);
    }
  }, [teams]);

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
      },
    ]);

    createTeam?.(teamName);

    setNewTeamName("");
    setIsCreatingTeam(false);
  };

  const handleAddInternToTeam = (teamId: string, internName: string) => {
    const trimmedName = internName.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) =>
        team.teamId === teamId
          ? {
            ...team,
            interns: [
              ...team.interns,
              { internId: buildInternId(teamId, trimmedName, team.interns), internName: trimmedName, status: "PENDING" },
            ],
          }
          : team
      )
    );

    addInternToTeam?.(teamId, trimmedName);
  };

  const handleVerifySubmission = (internId: string) => {
    setManagedTeams((prev) =>
      prev.map((team) => ({
        ...team,
        interns: team.interns.map((intern) =>
          intern.internId === internId
            ? {
              ...intern,
              status: intern.status === "COMPLETED" ? "PENDING" : "COMPLETED",
            }
            : intern
        ),
      }))
    );

    verifyStandupSubmission?.(internId);
  };

  const handleDeleteIntern = (internId: string) => {
    setManagedTeams((prev) =>
      prev.map((team) => ({
        ...team,
        interns: team.interns.filter((intern) => intern.internId !== internId),
      }))
    );

    deleteIntern?.(internId);
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

    updateIntern?.(internId, trimmedName);
  };

  const handleDeleteTeam = (teamId: string) => {
    setManagedTeams((prev) => prev.filter((team) => team.teamId !== teamId));
    deleteTeam?.(teamId);
  };

  const handleUpdateTeamName = (teamId: string, newName: string) => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) => (team.teamId === teamId ? { ...team, teamName: trimmedName } : team))
    );

    updateTeamName?.(teamId, trimmedName);
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

function buildInternId(
  teamId: string,
  internName: string,
  existingInterns: Team["interns"]
): string {
  const base = `${teamId}:${normalizeIdentifier(internName) || "intern"}`;
  const existingIds = new Set(existingInterns.map((intern) => intern.internId));
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

export default DashboardLayout;
