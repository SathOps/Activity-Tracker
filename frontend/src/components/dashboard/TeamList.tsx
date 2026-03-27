import React from 'react';
import InternCard, { SubmissionStatus } from '../intern/InternCard';
import type { Intern } from '../intern/InternSearch';

import type { InternAudioMetadata } from '../../services/corpus/corpusService';

export interface TeamIntern {
  internId: string;
  corpusUserId: string;
  internName?: string;
  status: SubmissionStatus;
  todayValidCount?: number;
  audios?: InternAudioMetadata[];
}

export interface Team {
  teamId: string;
  teamName: string;
  interns: TeamIntern[];
  todayStandupCount?: number;
  requiredStandupCount?: number;
  verifiedDate?: string;
  teamStatus?: SubmissionStatus;
}

export interface TeamListProps {
  teams: Team[];
  addedInterns?: Intern[];
  selectedDateLabel?: string;
  activeAudioId?: string | null;
  onPlay?: (internId: string, audioId: string) => void;
  onPause?: () => void;
  onVerifyTeam?: (teamId: string) => void;
  verifyingTeamId?: string | null;
  onAddInternToTeam?: (teamId: string, intern: Intern) => void;
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
  inputValue: '',
  showDropdown: false,
  selectedInternId: null,
};

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  addedInterns = [],
  selectedDateLabel,
  onVerifyTeam,
  verifyingTeamId,
  activeAudioId,
  onPlay,
  onPause,
  onAddInternToTeam,
  onDeleteIntern,
  onUpdateIntern,
  onDeleteTeam,
  onUpdateTeamName,
}) => {
  const [dropdownByTeam, setDropdownByTeam] = React.useState<
    Record<string, DropdownState>
  >({});
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null);
  const [teamNameDraftById, setTeamNameDraftById] = React.useState<
    Record<string, string>
  >({});
  const blurTimeoutRef = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const getState = (teamId: string): DropdownState =>
    dropdownByTeam[teamId] ?? emptyDropdownState;

  const patchState = (teamId: string, patch: Partial<DropdownState>) => {
    setDropdownByTeam((prev) => ({
      ...prev,
      [teamId]: { ...(prev[teamId] ?? emptyDropdownState), ...patch },
    }));
  };

  React.useEffect(() => {
    const blurTimeouts = blurTimeoutRef.current;

    return () => {
      Object.values(blurTimeouts).forEach(clearTimeout);
    };
  }, []);

  const isInternInAnyTeam = (internId: string): boolean =>
    teams.some((team) =>
      team.interns.some(
        (intern) =>
          intern.corpusUserId === internId || intern.internId === internId
      )
    );

  const getFilteredInterns = (
    teamId: string
  ): Array<Intern & { alreadyInTeam: boolean }> => {
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
    if (blurTimeoutRef.current[teamId]) {
      clearTimeout(blurTimeoutRef.current[teamId]);
    }

    patchState(teamId, { showDropdown: true });
  };

  const handleBlur = (teamId: string) => {
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
    const trimmedName = state.inputValue.trim();

    if (!trimmedName) {
      return;
    }

    const selectedIntern =
      addedInterns.find((intern) => intern.id === state.selectedInternId) ??
      addedInterns.find(
        (intern) => intern.name.toLowerCase() === trimmedName.toLowerCase()
      );

    if (!selectedIntern) {
      return;
    }

    if (isInternInAnyTeam(selectedIntern.id)) {
      return;
    }

    if (blurTimeoutRef.current[teamId]) {
      clearTimeout(blurTimeoutRef.current[teamId]);
      delete blurTimeoutRef.current[teamId];
    }

    onAddInternToTeam(teamId, selectedIntern);

    patchState(teamId, {
      inputValue: '',
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

    const nextName = (teamNameDraftById[teamId] ?? '').trim();

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
        const requiredCount = team.requiredStandupCount ?? 4;
        const standupCount = team.todayStandupCount ?? 0;
        const teamStatus = team.teamStatus ?? 'PENDING';
        const qualifiedStandupLabel = selectedDateLabel
          ? `${selectedDateLabel} qualified standups`
          : 'Selected date qualified standups';

        return (
          <article className="team-card" key={team.teamId}>
            <header className="team-header">
              <div style={{ display: 'grid', gap: 4 }}>
                {editingTeamId === team.teamId ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      aria-label={`Edit team name for ${team.teamName}`}
                      onChange={(event) =>
                        setTeamNameDraftById((prev) => ({
                          ...prev,
                          [team.teamId]: event.target.value,
                        }))
                      }
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 13,
                        minWidth: 220,
                        padding: '6px 8px',
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
                    <button
                      className="ghost-button"
                      onClick={handleCancelTeamRename}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h3 className="team-name">{team.teamName}</h3>
                )}

                <div className="team-id">
                  {qualifiedStandupLabel}: {standupCount}/{requiredCount} |{' '}
                  {teamStatus}
                </div>
                {team.verifiedDate ? (
                  <div className="team-id">
                    Verified date: {team.verifiedDate}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {onVerifyTeam ? (
                  <button
                    className="secondary-button"
                    onClick={() => onVerifyTeam(team.teamId)}
                    type="button"
                  >
                    {verifyingTeamId === team.teamId
                      ? 'Verifying...'
                      : 'Verify Team'}
                  </button>
                ) : null}
                {onUpdateTeamName && editingTeamId !== team.teamId ? (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      handleStartTeamRename(team.teamId, team.teamName)
                    }
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
              <div className="intern-dropdown-wrapper">
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <input
                    aria-label={`Add intern to ${team.teamName}`}
                    className="team-add-intern-input"
                    onChange={(event) =>
                      handleInputChange(team.teamId, event.target.value)
                    }
                    onFocus={() => handleFocus(team.teamId)}
                    onBlur={() => handleBlur(team.teamId)}
                    placeholder="Select intern from added list"
                    style={{
                      width: '100%',
                    }}
                    type="text"
                    value={state.inputValue}
                  />

                  {state.showDropdown ? (
                    <ul className="intern-dropdown" role="listbox">
                      {addedInterns.length === 0 ? (
                        <li className="intern-dropdown-empty">
                          No interns available
                        </li>
                      ) : filtered.length === 0 ? (
                        <li className="intern-dropdown-empty">
                          No matching interns
                        </li>
                      ) : (
                        filtered.map((intern) => (
                          <li
                            key={intern.id}
                            role="option"
                            aria-selected={state.selectedInternId === intern.id}
                            aria-disabled={intern.alreadyInTeam}
                            className={`intern-dropdown-item${intern.alreadyInTeam ? ' disabled' : ''}`}
                            tabIndex={intern.alreadyInTeam ? -1 : 0}
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            onClick={() => {
                              if (!intern.alreadyInTeam) {
                                handleSelectIntern(team.teamId, intern);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                if (!intern.alreadyInTeam) {
                                  handleSelectIntern(team.teamId, intern);
                                }
                              }
                            }}
                          >
                            <span className="intern-dropdown-name">
                              {intern.name}
                            </span>
                            <span className="intern-dropdown-id">
                              {intern.id}
                            </span>
                            {intern.alreadyInTeam ? (
                              <span className="intern-dropdown-badge">
                                Already in a team
                              </span>
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
                  standupDateLabel={selectedDateLabel}
                  todayValidCount={intern.todayValidCount}
                  audios={intern.audios}
                  activeAudioId={activeAudioId}
                  onPlay={onPlay}
                  onPause={onPause}
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
