import React from 'react';
import { useTranslation } from 'react-i18next';
import InternCard, { SubmissionStatus } from '../intern/InternCard';
import type { Intern } from '../intern/InternSearch';

import type { InternAudioMetadata } from '../../services/corpus/corpusService';
import type { StandupSlotResult } from '../../utils/verification';

export interface TeamIntern {
  internId: string;
  corpusUserId: string;
  internName?: string;
  status: SubmissionStatus;
  todayValidCount?: number;
  teamProgressCount?: number;
  slotStatuses?: StandupSlotResult[];
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
  teamSlotStatuses?: StandupSlotResult[];
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
  const { t } = useTranslation();
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
    return (
      <p className="border border-dashed border-[var(--border-strong)] rounded-xl text-[var(--text-subtle)] text-sm m-0 p-[22px_16px] text-center bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)]">
        {t('teams.noTeamsAvailable')}
      </p>
    );
  }

  return (
    <section className="grid gap-4">
      {teams.map((team) => {
        const state = getState(team.teamId);
        const filtered = getFilteredInterns(team.teamId);
        const requiredCount = team.requiredStandupCount ?? 4;
        const standupCount = team.todayStandupCount ?? 0;
        const teamStatus = team.teamStatus ?? 'PENDING';
        const qualifiedStandupLabel = selectedDateLabel
          ? t('teams.qualifiedStandupsOnDate', { date: selectedDateLabel })
          : t('teams.selectedDateQualifiedStandups');

        return (
          <article
            className="relative overflow-hidden border border-white/[0.08] bg-white/[0.05] backdrop-blur-[24px] rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25),_0_0_30px_rgba(59,130,246,0.1)] transition-all duration-[350ms] hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35),_0_0_50px_rgba(59,130,246,0.25)] dark:border-[var(--border-strong)] dark:bg-gradient-to-b dark:from-[var(--surface-0)] dark:to-[var(--surface-1)]"
            key={team.teamId}
          >
            <header className="flex items-center justify-between gap-2 mb-3">
              <div className="grid gap-1">
                {editingTeamId === team.teamId ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      aria-label={t('teams.editTeamNameFor', {
                        name: team.teamName,
                      })}
                      onChange={(event) =>
                        setTeamNameDraftById((prev) => ({
                          ...prev,
                          [team.teamId]: event.target.value,
                        }))
                      }
                      className="bg-[var(--surface-0)] border border-[var(--border)] rounded text-[13px] text-[var(--text-main)] min-w-[220px] px-2 py-1.5"
                      type="text"
                      value={teamNameDraftById[team.teamId] ?? team.teamName}
                    />
                    <button
                      className="ghost-button"
                      onClick={() => handleSaveTeamRename(team.teamId)}
                      type="button"
                    >
                      {t('button.save')}
                    </button>
                    <button
                      className="ghost-button"
                      onClick={handleCancelTeamRename}
                      type="button"
                    >
                      {t('button.cancel')}
                    </button>
                  </div>
                ) : (
                  <h3 className="m-0 text-[1.4rem] font-bold text-white tracking-[-0.02em]">
                    {team.teamName}
                  </h3>
                )}

                <div className="text-[#94a3b8] text-[0.85rem] font-medium">
                  {qualifiedStandupLabel}: {standupCount}/{requiredCount} |{' '}
                  {teamStatus}
                </div>
                {team.teamSlotStatuses?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {team.teamSlotStatuses.map((slot) => (
                      <span
                        key={slot.slotId}
                        className="inline-flex justify-center items-center text-[11px] font-bold rounded-full border px-2 py-0.5"
                        style={{
                          backgroundColor: getSlotStatusBackground(slot.status),
                          borderColor: getSlotStatusBorder(slot.status),
                          color: getSlotStatusColor(slot.status),
                        }}
                        title={`${slot.label} (${slot.windowLabel})`}
                      >
                        {slot.slotId}: {slot.status}
                      </span>
                    ))}
                  </div>
                ) : null}
                {team.verifiedDate ? (
                  <div className="text-[#94a3b8] text-[0.85rem] font-medium">
                    {t('teams.verifiedDate')}: {team.verifiedDate}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {onVerifyTeam ? (
                  <button
                    className="secondary-button"
                    onClick={() => onVerifyTeam(team.teamId)}
                    type="button"
                  >
                    {verifyingTeamId === team.teamId
                      ? t('teams.verifying')
                      : t('teams.verifyTeam')}
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
                    {t('teams.editTeam')}
                  </button>
                ) : null}
                {onDeleteTeam ? (
                  <button
                    className="secondary-button"
                    onClick={() => onDeleteTeam(team.teamId)}
                    type="button"
                  >
                    {t('teams.deleteTeam')}
                  </button>
                ) : null}
              </div>
            </header>

            {onAddInternToTeam ? (
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    aria-label={t('teams.addInternToTeam', {
                      name: team.teamName,
                    })}
                    className="team-add-intern-input w-full"
                    onChange={(event) =>
                      handleInputChange(team.teamId, event.target.value)
                    }
                    onFocus={() => handleFocus(team.teamId)}
                    onBlur={() => handleBlur(team.teamId)}
                    placeholder={t('teams.selectInternFromAddedList')}
                    type="text"
                    value={state.inputValue}
                  />

                  {state.showDropdown ? (
                    <ul className="absolute left-0 right-0 z-10 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-soft)] list-none m-1 max-h-[220px] overflow-y-auto p-1">
                      {addedInterns.length === 0 ? (
                        <li className="text-[var(--text-subtle)] text-[13px] list-none p-[10px_12px] text-center">
                          {t('interns.noInternsAvailable')}
                        </li>
                      ) : filtered.length === 0 ? (
                        <li className="text-[var(--text-subtle)] text-[13px] list-none p-[10px_12px] text-center">
                          {t('interns.noMatchingInterns')}
                        </li>
                      ) : (
                        filtered.map((intern) => (
                          <li
                            key={intern.id}
                            className={`flex items-center gap-2 text-[13px] px-2.5 py-2 transition-colors duration-120 ${
                              intern.alreadyInTeam
                                ? 'text-[var(--text-soft)] cursor-default bg-[var(--surface-1)]'
                                : 'cursor-pointer hover:bg-[var(--surface-2)]'
                            }`}
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
                            <span className="text-[var(--text-main)] font-semibold">
                              {intern.name}
                            </span>
                            <span className="text-[var(--text-subtle)] text-xs">
                              {intern.id}
                            </span>
                            {intern.alreadyInTeam ? (
                              <span className="ml-auto bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-full text-[var(--danger-text)] text-[11px] font-semibold px-2 py-0.5">
                                {t('interns.alreadyInTeam')}
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
                  {t('interns.addIntern')}
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4.5 mt-5">
              {team.interns.map((intern) => (
                <InternCard
                  key={intern.internId}
                  internId={intern.internId}
                  internName={intern.internName}
                  onDeleteIntern={onDeleteIntern}
                  onUpdateIntern={onUpdateIntern}
                  standupDateLabel={selectedDateLabel}
                  todayValidCount={intern.todayValidCount}
                  slotStatuses={intern.slotStatuses}
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

function getSlotStatusBackground(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return '#dcfce7';
  }

  if (status === 'DELAYED') {
    return '#fef3c7';
  }

  if (status === 'UPCOMING') {
    return '#f1f5f9';
  }

  return '#fee2e2';
}

function getSlotStatusBorder(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return '#86efac';
  }

  if (status === 'DELAYED') {
    return '#fcd34d';
  }

  if (status === 'UPCOMING') {
    return '#cbd5e1';
  }

  return '#fca5a5';
}

function getSlotStatusColor(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return '#166534';
  }

  if (status === 'DELAYED') {
    return '#92400e';
  }

  if (status === 'UPCOMING') {
    return '#475569';
  }

  return '#991b1b';
}

export default TeamList;
