import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, X } from 'lucide-react';
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

        const progressPercentage = Math.min(
          Math.round((standupCount / requiredCount) * 100),
          100
        );

        return (
          <article
            className="p-6 relative overflow-hidden bg-blue-600/5 dark:bg-blue-950/15 border border-blue-500/30 dark:border-blue-500/20 rounded-3xl backdrop-blur-md shadow-[0_8px_32px_0_rgba(30,79,178,0.1)] hover:shadow-[0_8px_32px_0_rgba(30,79,178,0.25)] hover:border-blue-500/40 transition-all duration-300"
            key={team.teamId}
          >
            <header className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="grid gap-1.5 flex-1 min-w-0">
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
                  <h3 className="m-0 text-xl font-extrabold text-[var(--text-main)] tracking-tight truncate">
                    {team.teamName}
                  </h3>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                    {qualifiedStandupLabel}:
                  </span>
                  <span className="text-xs font-bold bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/25 dark:border-blue-400/20 backdrop-blur-md shadow-[0_2px_8px_rgba(59,130,246,0.08)]">
                    {standupCount}/{requiredCount}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                      teamStatus === 'COMPLETED'
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-400/20 shadow-[0_2px_8px_rgba(16,185,129,0.08)]'
                        : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 dark:border-amber-400/20 shadow-[0_2px_8px_rgba(245,158,11,0.08)]'
                    }`}
                  >
                    {teamStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
                  </span>
                </div>

                {/* Progress Indicator */}
                <div className="w-full bg-slate-200/50 dark:bg-slate-800/55 h-2 rounded-full overflow-hidden mt-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                {team.teamSlotStatuses?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {team.teamSlotStatuses.map((slot) => (
                      <span
                        key={slot.slotId}
                        className="inline-flex justify-center items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md transition-all duration-200"
                        style={{
                          backgroundColor: getSlotStatusBackground(slot.status),
                          borderColor: getSlotStatusBorder(slot.status),
                          color: getSlotStatusColor(slot.status),
                        }}
                        title={`${slot.label} (${slot.windowLabel}): ${slot.status}`}
                      >
                        {renderSlotIcon(slot.status)}
                        <span>{getSlotTimeLabel(slot.slotId)}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                {team.verifiedDate ? (
                  <div className="text-[var(--text-soft)] text-xs font-medium mt-1.5">
                    {t('teams.verifiedDate')}: {team.verifiedDate}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {onVerifyTeam ? (
                  <button
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer border-none outline-none"
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
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 rounded-xl border border-slate-300/60 dark:border-slate-700 shadow-sm transition-all duration-200 cursor-pointer outline-none"
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
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer border-none outline-none"
                    onClick={() => onDeleteTeam(team.teamId)}
                    type="button"
                  >
                    {t('teams.deleteTeam')}
                  </button>
                ) : null}
              </div>
            </header>

            {onAddInternToTeam ? (
              <div className="flex flex-wrap items-start gap-2 mb-4">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    aria-label={t('teams.addInternToTeam', {
                      name: team.teamName,
                    })}
                    className="w-full px-4 py-2 bg-slate-500/5 dark:bg-slate-950/20 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200"
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
                    <ul
                      className="absolute left-0 right-0 z-20 glass rounded-xl shadow-lg list-none m-1 max-h-[220px] overflow-y-auto p-1 backdrop-blur-xl"
                      style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
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
                            className={`flex items-center gap-2 text-[13px] px-2.5 py-2 transition-colors duration-120 rounded-lg ${
                              intern.alreadyInTeam
                                ? 'text-[var(--text-soft)] cursor-default bg-black/5 dark:bg-white/5'
                                : 'cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-main)]'
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
                            <span className="text-[var(--text-soft)] text-xs">
                              {intern.id}
                            </span>
                            {intern.alreadyInTeam ? (
                              <span className="ml-auto bg-red-500/10 border border-red-500/20 rounded-full text-red-600 dark:text-red-400 text-[10px] font-semibold px-2 py-0.5">
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
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer border-none outline-none"
                  onClick={() => handleAddIntern(team.teamId)}
                  type="button"
                >
                  {t('interns.addIntern')}
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mt-4">
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

const getSlotTimeLabel = (slotId: string) => {
  switch (slotId) {
    case 'S1':
      return '09:00';
    case 'S2':
      return '12:00';
    case 'S3':
      return '14:00';
    case 'S4':
      return '16:30';
    default:
      return slotId;
  }
};

const renderSlotIcon = (status: string) => {
  const iconStyle = { width: 10, height: 10, strokeWidth: 3.5, flexShrink: 0 };
  switch (status) {
    case 'GOOD':
      return <Check style={iconStyle} />;
    case 'DELAYED':
      return <Clock style={{ ...iconStyle, strokeWidth: 2.5 }} />;
    case 'MISSING':
      return <X style={iconStyle} />;
    case 'UPCOMING':
    default:
      return (
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            flexShrink: 0,
          }}
        />
      );
  }
};

function getSlotStatusBackground(status: StandupSlotResult['status']): string {
  return `var(--slot-${status.toLowerCase()}-bg)`;
}

function getSlotStatusBorder(status: StandupSlotResult['status']): string {
  return `var(--slot-${status.toLowerCase()}-border)`;
}

function getSlotStatusColor(status: StandupSlotResult['status']): string {
  return `var(--slot-${status.toLowerCase()}-text)`;
}

export default TeamList;
