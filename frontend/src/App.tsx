import { useMemo, useState } from "react";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import { Team } from "./components/dashboard/TeamList";
import { SubmissionStatus } from "./components/intern/InternCard";

const getNextStatus = (status: SubmissionStatus): SubmissionStatus =>
  status === "PENDING" ? "COMPLETED" : "PENDING";

const initialTeams: Team[] = [
  {
    teamId: "team-1",
    teamName: "Alpha Team",
    interns: [
      { internId: "INT-1001", status: "COMPLETED" },
      { internId: "INT-1002", status: "PENDING" }
    ]
  },
  {
    teamId: "team-2",
    teamName: "Beta Team",
    interns: [
      { internId: "INT-1003", status: "PENDING" },
      { internId: "INT-1004", status: "COMPLETED" }
    ]
  }
];

export default function App() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const handleCreateTeam = () => {
    const nextId = `team-${teams.length + 1}`;
    const nextName = `Team ${teams.length + 1}`;

    setTeams((prev) => [
      ...prev,
      {
        teamId: nextId,
        teamName: nextName,
        interns: []
      }
    ]);
  };

  const handleAddInternToTeam = (teamId: string) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamId !== teamId) {
          return team;
        }

        const nextInternNumber = team.interns.length + 1;
        return {
          ...team,
          interns: [
            ...team.interns,
            {
              internId: `${teamId.toUpperCase()}-INT-${String(nextInternNumber).padStart(3, "0")}`,
              status: "PENDING"
            }
          ]
        };
      })
    );
  };

  const handleVerifySubmission = (internId: string) => {
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        interns: team.interns.map((intern) =>
          intern.internId === internId
            ? { ...intern, status: getNextStatus(intern.status) }
            : intern
        )
      }))
    );
  };

  const completedCount = useMemo(
    () =>
      teams
        .flatMap((team) => team.interns)
        .filter((intern) => intern.status === "COMPLETED").length,
    [teams]
  );

  const totalInterns = useMemo(
    () => teams.flatMap((team) => team.interns).length,
    [teams]
  );

  return (
    <div className="app-shell">
      <section className="summary-row">
        <div className="summary-card">
          <span className="summary-label">Teams</span>
          <strong className="summary-value">{teams.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Interns</span>
          <strong className="summary-value">{totalInterns}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Completed</span>
          <strong className="summary-value">{completedCount}</strong>
        </div>
      </section>

      <DashboardLayout
        teams={teams}
        onAddInternToTeam={handleAddInternToTeam}
        onCreateTeam={handleCreateTeam}
        onVerifySubmission={handleVerifySubmission}
      />
    </div>
  );
}
