import React from "react";
import InternCard, { SubmissionStatus } from "../intern/InternCard";

export interface TeamIntern {
  internId: string;
  status: SubmissionStatus;
}

export interface Team {
  teamId: string;
  teamName: string;
  interns: TeamIntern[];
}

export interface TeamListProps {
  teams: Team[];
  onVerifySubmission?: (internId: string) => void;
  onAddInternToTeam?: (teamId: string) => void;
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onVerifySubmission,
  onAddInternToTeam,
}) => {
  if (teams.length === 0) {
    return <p className="team-empty">No teams available.</p>;
  }

  return (
    <section className="team-list">
      {teams.map((team) => (
        <article className="team-card" key={team.teamId}>
          <header className="team-header">
            <div>
              <h3 className="team-name">{team.teamName}</h3>
              <p className="team-id">teamId: {team.teamId}</p>
            </div>

            {onAddInternToTeam ? (
              <button
                className="secondary-button"
                onClick={() => onAddInternToTeam(team.teamId)}
                type="button"
              >
                Add Intern
              </button>
            ) : null}
          </header>

          <div className="team-interns">
            {team.interns.map((intern) => (
              <InternCard
                key={intern.internId}
                internId={intern.internId}
                onVerifySubmission={onVerifySubmission}
                status={intern.status}
              />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
};

export default TeamList;
