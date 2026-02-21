import React from "react";
import InternCard, { SubmissionStatus } from "../intern/InternCard";
import type { Intern } from "../intern/InternSearch";

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
  addedInterns?: Intern[];
  onVerifySubmission?: (internId: string) => void;
  onAddInternToTeam?: (teamId: string, internName: string) => void;
  onDeleteIntern?: (internId: string) => void;
  onUpdateIntern?: (internId: string, newName: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onUpdateTeamName?: (teamId: string, newName: string) => void;
}

interface DropdownState {
  inputValue: string;
  showDropdown: boolean;
  selectedInternId: string | null;
}

const emptyDropdownState: DropdownState = {
  inputValue: "",
  showDropdown: false,
  selectedInternId: null,
};

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  addedInterns = [],
  onVerifySubmission,
  onAddInternToTeam,
  onDeleteIntern,
  onUpdateIntern,
  onDeleteTeam,
  onUpdateTeamName,
}) => {
  const [dropdownByTeam, setDropdownByTeam] = React.useState<Record<string, DropdownState>>({});
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null);
  const [teamNameDraftById, setTeamNameDraftById] = React.useState<Record<string, string>>({});
  const blurTimeoutRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const getState = (teamId: string): DropdownState =>
    dropdownByTeam[teamId] ?? emptyDropdownState;

  const patchState = (teamId: string, patch: Partial<DropdownState>) => {
    setDropdownByTeam((prev) => ({
      ...prev,
      [teamId]: { ...getState(teamId), ...patch },
    }));
  };

  // Clean up blur timeouts on unmount
  React.useEffect(() => {
    return () => {
      Object.values(blurTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  const isInternInAnyTeam = (internId: string): boolean =>
    teams.some((team) =>
      team.interns.some(
        (i) => i.internId === internId || (i.internName ?? "").toLowerCase() === internId.toLowerCase()
      )
    );

  const getFilteredInterns = (teamId: string): (Intern & { alreadyInTeam: boolean })[] => {
    const { inputValue } = getState(teamId);
    const query = inputValue.trim().toLowerCase();

    return addedInterns
      .filter((intern) => !query || intern.name.toLowerCase().includes(query))
      .map((intern) => ({
        ...intern,
        alreadyInTeam: isInternInAnyTeam(intern.id),
      }));
  };

  const handleInputChange = (teamId: string, value: string) => {
    patchState(teamId, {
      inputValue: value,
      showDropdown: true,
      selectedInternId: null,
    });
  };

  const handleFocus = (teamId: string) => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current[teamId]) {
      clearTimeout(blurTimeoutRef.current[teamId]);
    }
    patchState(teamId, { showDropdown: true });
  };

  const handleBlur = (teamId: string) => {
    // Delay closing so click events on dropdown items fire first
    blurTimeoutRef.current[teamId] = setTimeout(() => {
      patchState(teamId, { showDropdown: false });
    }, 200);
  };

  const handleSelectIntern = (teamId: string, intern: Intern) => {
    patchState(teamId, {
      inputValue: intern.name,
      selectedInternId: intern.id,
      showDropdown: false,
    });
  };

  const handleAddIntern = (teamId: string) => {
    if (!onAddInternToTeam) {
      return;
    }

    const state = getState(teamId);
    const name = state.inputValue.trim();
    if (!name) {
      return;
    }

    // Prevent adding if the intern is already in any team
    if (state.selectedInternId && isInternInAnyTeam(state.selectedInternId)) {
      return;
    }

    onAddInternToTeam(teamId, name);
    patchState(teamId, {
      inputValue: "",
      selectedInternId: null,
      showDropdown: false,
    });
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
      {teams.map((team) => {
        const state = getState(team.teamId);
        const filtered = getFilteredInterns(team.teamId);

        return (
          <article className="team-card" key={team.teamId}>
            <header className="team-header">
              <div>
                <h3 className="team-name">{team.teamName}</h3>
                <p className="team-id">teamId: {team.teamId}</p>
              </div>
              {onDeleteTeam ? (
                <button
                  className="secondary-button"
                  onClick={() => onDeleteTeam(team.teamId)}
                  type="button"
                >
                  Delete Team
                </button>
              ) : null}
            </header>

            {onAddInternToTeam ? (
              <div className="intern-dropdown-wrapper">
                <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                  <input
                    aria-label={`Add intern to ${team.teamName}`}
                    onChange={(e) => handleInputChange(team.teamId, e.target.value)}
                    onFocus={() => handleFocus(team.teamId)}
                    onBlur={() => handleBlur(team.teamId)}
                    placeholder="Enter intern name"
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      padding: "8px 10px",
                      width: "100%",
                    }}
                    type="text"
                    value={state.inputValue}
                  />

                  {state.showDropdown ? (
                    <ul className="intern-dropdown" role="listbox">
                      {addedInterns.length === 0 ? (
                        <li className="intern-dropdown-empty">No interns available</li>
                      ) : filtered.length === 0 ? (
                        <li className="intern-dropdown-empty">No matching interns</li>
                      ) : (
                        filtered.map((intern) => (
                          <li
                            key={intern.id}
                            role="option"
                            aria-selected={state.selectedInternId === intern.id}
                            aria-disabled={intern.alreadyInTeam}
                            className={`intern-dropdown-item${intern.alreadyInTeam ? " disabled" : ""}`}
                            onMouseDown={(e) => {
                              // Prevent blur from firing before click
                              e.preventDefault();
                            }}
                            onClick={() => {
                              if (!intern.alreadyInTeam) {
                                handleSelectIntern(team.teamId, intern);
                              }
                            }}
                          >
                            <span className="intern-dropdown-name">{intern.name}</span>
                            <span className="intern-dropdown-id">{intern.id}</span>
                            {intern.alreadyInTeam ? (
                              <span className="intern-dropdown-badge">Already in a team</span>
                            ) : null}
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </div>

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
        );
      })}
    </section>
  );
};

export default TeamList;
