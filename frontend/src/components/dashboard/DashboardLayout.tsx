import React from "react";
import TeamList, { Team } from "./TeamList";
import InternCard from "../intern/InternCard";

export interface DashboardLayoutProps {
  teams?: Team[];
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
}

const mockTeams: Team[] = [
  {
    teamId: "team-1",
    teamName: "Alpha Team",
    interns: [
      { internId: "INT-1001", internName: "Asha", status: "COMPLETED" },
      { internId: "INT-1002", internName: "Rahul", status: "PENDING" },
    ],
  },
  {
    teamId: "team-2",
    teamName: "Beta Team",
    interns: [
      { internId: "INT-1003", internName: "Meena", status: "COMPLETED" },
      { internId: "INT-1004", internName: "Kiran", status: "PENDING" },
    ],
  },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  teams = mockTeams,
  onCreateTeam,
  onAddInternToTeam,
  onVerifySubmission,
  verifyStandupSubmission,
  createTeam,
  addInternToTeam,
  deleteIntern,
  updateIntern,
  deleteTeam,
  title = "Team-wise Standup Submission Dashboard",
}) => {
  const [managedTeams, setManagedTeams] = React.useState<Team[]>(() => teams);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreatingTeam, setIsCreatingTeam] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [activeView, setActiveView] = React.useState<"TEAMS" | "INTERNS" | "COMPLETED">(
    "TEAMS"
  );
  const [hoveredBox, setHoveredBox] = React.useState<"TEAMS" | "INTERNS" | "COMPLETED" | null>(
    null
  );

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
        intern.internId.toLowerCase().includes(normalizedQuery) ||
        intern.teamName.toLowerCase().includes(normalizedQuery)
    );
  }, [activeView, allInternRows, normalizedQuery]);

  const handleCreateTeam = () => {
    const teamName = newTeamName.trim();
    if (!teamName) {
      return;
    }

    const nextTeamId = `team-${Date.now()}`;
    const nextTeam: Team = { teamId: nextTeamId, teamName, interns: [] };

    setManagedTeams((prev) => [...prev, nextTeam]);
    if (createTeam) {
      createTeam(teamName);
    }

    setNewTeamName("");
    setIsCreatingTeam(false);
  };

  const handleAddInternToTeam = (teamId: string, internName: string) => {
    const trimmedName = internName.trim();
    if (!trimmedName) {
      return;
    }

    const nextInternId = `INT-${Math.floor(100000 + Math.random() * 900000)}`;
    setManagedTeams((prev) =>
      prev.map((team) =>
        team.teamId === teamId
          ? {
              ...team,
              interns: [
                ...team.interns,
                { internId: nextInternId, internName: trimmedName, status: "PENDING" },
              ],
            }
          : team
      )
    );

    if (addInternToTeam) {
      addInternToTeam(teamId, trimmedName);
    }
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

    if (verifyStandupSubmission) {
      verifyStandupSubmission(internId);
    }
  };

  const handleDeleteIntern = (internId: string) => {
    setManagedTeams((prev) =>
      prev.map((team) => ({
        ...team,
        interns: team.interns.filter((intern) => intern.internId !== internId),
      }))
    );
    if (deleteIntern) {
      deleteIntern(internId);
    }
  };

  const handleUpdateIntern = (internId: string, newName: string) => {
    setManagedTeams((prev) =>
      prev.map((team) => ({
        ...team,
        interns: team.interns.map((intern) =>
          intern.internId === internId ? { ...intern, internName: newName } : intern
        ),
      }))
    );
    if (updateIntern) {
      updateIntern(internId, newName);
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    setManagedTeams((prev) => prev.filter((team) => team.teamId !== teamId));
    if (deleteTeam) {
      deleteTeam(teamId);
    }
  };

  return (
    <main className="dashboard-container">
      <style>{`.summary-row { display: none !important; }`}</style>
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
              : "Search by intern, internId, or team..."
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
          onAddInternToTeam={handleAddInternToTeam}
          onDeleteIntern={handleDeleteIntern}
          onDeleteTeam={handleDeleteTeam}
          onUpdateIntern={handleUpdateIntern}
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
                    <p className="team-id">teamId: {intern.teamId}</p>
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

export default DashboardLayout;
