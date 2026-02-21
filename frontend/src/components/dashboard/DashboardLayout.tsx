import React from "react";
import TeamList, { Team } from "./TeamList";

export interface DashboardLayoutProps {
  teams?: Team[];
  onCreateTeam?: () => void;
  onAddInternToTeam?: (teamId: string) => void;
  onVerifySubmission?: (internId: string) => void;
  title?: string;
}

const mockTeams: Team[] = [
  {
    teamId: "team-1",
    teamName: "Alpha Team",
    interns: [
      { internId: "INT-1001", status: "COMPLETED" },
      { internId: "INT-1002", status: "PENDING" },
    ],
  },
  {
    teamId: "team-2",
    teamName: "Beta Team",
    interns: [
      { internId: "INT-1003", status: "COMPLETED" },
      { internId: "INT-1004", status: "PENDING" },
    ],
  },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  teams = mockTeams,
  onCreateTeam,
  onAddInternToTeam,
  onVerifySubmission,
  title = "Team-wise Standup Submission Dashboard",
}) => {
  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">{title}</h1>
        {onCreateTeam ? (
          <button className="primary-button" onClick={onCreateTeam} type="button">
            Create Team
          </button>
        ) : null}
      </header>

      <TeamList
        onAddInternToTeam={onAddInternToTeam}
        onVerifySubmission={onVerifySubmission}
        teams={teams}
      />
    </main>
  );
};

export default DashboardLayout;
