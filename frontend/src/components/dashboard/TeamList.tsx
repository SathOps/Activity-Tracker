import React from "react";
import InternCard, { SubmissionStatus } from "../intern/InternCard";

export interface TeamIntern {
  internId: string;
  internName?: string;
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
  onAddInternToTeam?: (teamId: string, internName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onUpdateIntern?: (internId: string, newName: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onUpdateTeamName?: (teamId: string, newName: string) => void;
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onVerifySubmission,
  onAddInternToTeam,
  onDeleteIntern,
  onUpdateIntern,
  onDeleteTeam,
  onUpdateTeamName,
}) => {
  const [draftByTeam, setDraftByTeam] = React.useState<Record<string, string>>({});
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null);
  const [teamNameDraftById, setTeamNameDraftById] = React.useState<Record<string, string>>({});

  const handleInternDraftChange = (teamId: string, internName: string) => {
    setDraftByTeam((prev) => ({ ...prev, [teamId]: internName }));
  };

  const handleAddIntern = (teamId: string) => {
    if (!onAddInternToTeam) {
      return;
    }

    const name = (draftByTeam[teamId] ?? "").trim();
    if (!name) {
      return;
    }

    onAddInternToTeam(teamId, name);
    setDraftByTeam((prev) => ({ ...prev, [teamId]: "" }));
  };

  const handleStartTeamRename = (teamId: string, currentName: string) => {
    setEditingTeamId(teamId);
    setTeamNameDraftById((prev) => ({ ...prev, [teamId]: currentName }));
  };

  const handleCancelTeamRename = () => {
    setEditingTeamId(null);
  };

  const handleSaveTeamRename = (teamId: string) => {
    if (!onUpdateTeamName) {
      setEditingTeamId(null);
      return;
    }

    const nextName = (teamNameDraftById[teamId] ?? "").trim();

    if (!nextName) {
      return;
    }

    onUpdateTeamName(teamId, nextName);
    setEditingTeamId(null);
  };

  if (teams.length === 0) {
    return <p className="team-empty">No teams available.</p>;
  }

  return (
    <section className="team-list">
      {teams.map((team) => (
        <article className="team-card" key={team.teamId}>
          <header className="team-header">
            <div>
              {editingTeamId === team.teamId ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    aria-label={`Edit team name for ${team.teamName}`}
                    onChange={(event) =>
                      setTeamNameDraftById((prev) => ({
                        ...prev,
                        [team.teamId]: event.target.value,
                      }))
                    }
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      minWidth: 220,
                      padding: "6px 8px",
                    }}
                    type="text"
                    value={teamNameDraftById[team.teamId] ?? team.teamName}
                  />
                  <button
                    className="ghost-button"
                    onClick={() => handleSaveTeamRename(team.teamId)}
                    type="button"
                  >
                    Save
                  </button>
                  <button className="ghost-button" onClick={handleCancelTeamRename} type="button">
                    Cancel
                  </button>
                </div>
              ) : (
                <h3 className="team-name">{team.teamName}</h3>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {onUpdateTeamName && editingTeamId !== team.teamId ? (
                <button
                  className="secondary-button"
                  onClick={() => handleStartTeamRename(team.teamId, team.teamName)}
                  type="button"
                >
                  Edit Team
                </button>
              ) : null}
              {onDeleteTeam ? (
                <button
                  className="secondary-button"
                  onClick={() => onDeleteTeam(team.teamId)}
                  type="button"
                >
                  Delete Team
                </button>
              ) : null}
            </div>
          </header>

          {onAddInternToTeam ? (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <input
                aria-label={`Add intern to ${team.teamName}`}
                onChange={(event) => handleInternDraftChange(team.teamId, event.target.value)}
                placeholder="Enter intern name"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  minWidth: 220,
                  padding: "8px 10px",
                }}
                type="text"
                value={draftByTeam[team.teamId] ?? ""}
              />
              <button
                className="secondary-button"
                onClick={() => handleAddIntern(team.teamId)}
                type="button"
              >
                Add Intern
              </button>
            </div>
          ) : null}

          <div className="team-interns">
            {team.interns.map((intern) => (
              <InternCard
                key={intern.internId}
                internId={intern.internId}
                internName={intern.internName}
                onDeleteIntern={onDeleteIntern}
                onUpdateIntern={onUpdateIntern}
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
