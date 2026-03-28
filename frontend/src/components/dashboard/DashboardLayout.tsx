import React from 'react';
import TeamList, { Team } from './TeamList';
import InternCard from '../intern/InternCard';
import type { Intern } from '../intern/InternSearch';
import { parseTimestamp } from '../../utils/timestamps';
import {
  buildStandupSlotResults,
  countCompletedStandupSlots,
  getDateKeyInTimeZone,
  getDefaultStandupTimeZone,
  isValidStandupSubmissionAudio,
  verifyStandupSubmission,
  type StandupSlotResult,
} from '../../utils/verification';
import { getInternAudios } from '../../services/corpus';
import type { InternAudioMetadata } from '../../services/corpus';

type DashboardView = 'TEAMS' | 'INTERNS' | 'COMPLETED';
type StatusView = 'DAILY' | 'WEEKLY';

interface TeamDailyStatusRow {
  teamId: string;
  teamName: string;
  standupCount: number;
  requiredStandupCount: number;
  remainingStandupCount: number;
  isCompleted: boolean;
  slotStatuses: StandupSlotResult[];
  contributorDetails: ContributorUploadDetail[];
}

interface WeeklyDayStatus {
  dateKey: string;
  dayLabel: string;
  fullDateLabel: string;
  standupCount: number;
  requiredStandupCount: number;
  remainingStandupCount: number;
  isCompleted: boolean;
  contributorDetails: ContributorUploadDetail[];
}

interface TeamWeeklyStatusRow {
  teamId: string;
  teamName: string;
  dayStatuses: WeeklyDayStatus[];
  completedDaysCount: number;
  pendingDayDetails: string[];
  totalRemainingStandups: number;
}

interface SubmissionAliasCriteria {
  standupAliases: Set<string>;
  internshipAliases: Set<string>;
}

interface ContributorUploadDetail {
  internId: string;
  internName: string;
  uploadCount: number;
}

export interface DashboardLayoutProps {
  teams?: Team[];
  addedInterns?: Intern[];
  title?: string;
  statusDisplay?: 'modal' | 'inline';
}

const DEFAULT_VIEW: DashboardView = 'TEAMS';
const EMPTY_TEAMS: Team[] = [];
const REQUIRED_TEAM_STANDUPS = 4;
const REQUIRED_CATEGORY_UUID_ALIASES = [
  'c81f5d73-9090-453e-bb08-c2f46453e0bd',
  '4dd053f4-6323-43d4-87a3-ce1816bd9459',
];
const STANDUP_ALIAS_OVERRIDE = mergeAliases(
  ['Stand-Up', ...REQUIRED_CATEGORY_UUID_ALIASES],
  parseAliasEnv(import.meta.env.VITE_STANDUP_LABEL_ALIASES)
);
const INTERNSHIP_ALIAS_OVERRIDE = mergeAliases(
  ['Internship', ...REQUIRED_CATEGORY_UUID_ALIASES],
  parseAliasEnv(import.meta.env.VITE_INTERNSHIP_LABEL_ALIASES)
);
const STANDUP_TIME_ZONE = getDefaultStandupTimeZone();
const STATUS_FETCH_BATCH_SIZE = 4;
const MAX_INTERN_FETCH_ATTEMPTS = 3;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  teams,
  addedInterns,
  title = 'Team-wise Standup Submission Dashboard',
  statusDisplay = 'modal',
}) => {
  const [managedTeams, setManagedTeams] = React.useState<Team[]>(
    () => teams ?? EMPTY_TEAMS
  );
  const [selectedDateKey, setSelectedDateKey] = React.useState(() =>
    getLocalDateKey(new Date())
  );
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreatingTeam, setIsCreatingTeam] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [activeView, setActiveView] =
    React.useState<DashboardView>(DEFAULT_VIEW);
  const [verifyingTeamId, setVerifyingTeamId] = React.useState<string | null>(
    null
  );
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [statusView, setStatusView] = React.useState<StatusView>('DAILY');
  const [activeAudioId, setActiveAudioId] = React.useState<string | null>(null);
  const [statusLoading, setStatusLoading] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [teamDailyStatusRows, setTeamDailyStatusRows] = React.useState<
    TeamDailyStatusRow[]
  >([]);
  const [teamWeeklyStatusRows, setTeamWeeklyStatusRows] = React.useState<
    TeamWeeklyStatusRow[]
  >([]);
  const hasInitializedDateSelection = React.useRef(false);
  const statusLoadRequestId = React.useRef(0);

  React.useEffect(() => {
    if (teams) {
      setManagedTeams(teams);
    }
  }, [teams]);

  React.useEffect(() => {
    if (!hasInitializedDateSelection.current) {
      hasInitializedDateSelection.current = true;
      return;
    }

    setManagedTeams((prev) => prev.map((team) => resetTeamVerification(team)));
  }, [selectedDateKey]);

  const teamProgressById = React.useMemo(
    () => buildTeamProgressById(managedTeams),
    [managedTeams]
  );
  const displayTeams = React.useMemo(
    () =>
      managedTeams.map((team) =>
        deriveTeamWithTeamProgress(team, teamProgressById)
      ),
    [managedTeams, teamProgressById]
  );
  const allInternRows = React.useMemo(
    () =>
      displayTeams.flatMap((team) =>
        team.interns.map((intern) => ({
          ...intern,
          teamId: team.teamId,
          teamName: team.teamName,
          requiredStandupCount:
            team.requiredStandupCount ?? REQUIRED_TEAM_STANDUPS,
        }))
      ),
    [displayTeams]
  );
  const selectedDateLabel = React.useMemo(
    () => formatDateForDisplay(selectedDateKey),
    [selectedDateKey]
  );
  const selectedWeekDateKeys = React.useMemo(
    () => getWeekDateKeys(selectedDateKey),
    [selectedDateKey]
  );
  const selectedWeekLabel = React.useMemo(
    () => formatWeekRangeLabel(selectedWeekDateKeys),
    [selectedWeekDateKeys]
  );
  const pendingDailyRows = React.useMemo(
    () => teamDailyStatusRows.filter((row) => !row.isCompleted),
    [teamDailyStatusRows]
  );
  const pendingWeeklyRows = React.useMemo(
    () =>
      teamWeeklyStatusRows.filter((row) => row.pendingDayDetails.length > 0),
    [teamWeeklyStatusRows]
  );
  const isInlineStatusView = statusDisplay === 'inline';
  const isStatusPanelOpen = isInlineStatusView || isStatusModalOpen;

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filteredTeams = React.useMemo(() => {
    if (!normalizedQuery) {
      return displayTeams;
    }

    return displayTeams.filter((team) =>
      team.teamName.toLowerCase().includes(normalizedQuery)
    );
  }, [displayTeams, normalizedQuery]);

  const filteredInternRows = React.useMemo(() => {
    const source =
      activeView === 'COMPLETED'
        ? allInternRows.filter((intern) => intern.status === 'COMPLETED')
        : allInternRows;

    if (!normalizedQuery) {
      return source;
    }

    return source.filter(
      (intern) =>
        (intern.internName ?? '').toLowerCase().includes(normalizedQuery) ||
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
        teamStatus: 'PENDING',
        todayStandupCount: 0,
        requiredStandupCount: REQUIRED_TEAM_STANDUPS,
        teamSlotStatuses: createMissingSlotStatuses(),
      },
    ]);

    setNewTeamName('');
    setIsCreatingTeam(false);
  };

  const handleAddInternToTeam = (teamId: string, intern: Intern) => {
    const trimmedName = intern.name.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) => {
        if (team.teamId !== teamId) {
          return team;
        }

        const duplicateExists = team.interns.some(
          (existingIntern) =>
            existingIntern.corpusUserId === intern.id ||
            existingIntern.internId === intern.id
        );

        if (duplicateExists) {
          return team;
        }

        return {
          ...team,
          teamStatus: 'PENDING',
          todayStandupCount: 0,
          verifiedDate: undefined,
          requiredStandupCount: REQUIRED_TEAM_STANDUPS,
          interns: [
            ...team.interns,
            {
              internId: intern.id,
              corpusUserId: intern.id,
              internName: trimmedName,
              status: 'PENDING',
              todayValidCount: 0,
              slotStatuses: createMissingSlotStatuses(),
            },
          ],
        };
      })
    );
  };

  const handleVerifyTeam = async (teamId: string) => {
    const team = managedTeams.find(
      (candidateTeam) => candidateTeam.teamId === teamId
    );

    if (!team || team.interns.length === 0) {
      return;
    }

    const verificationDateKey = selectedDateKey;
    setVerifyingTeamId(teamId);

    try {
      const verificationResults = await Promise.all(
        team.interns.map(async (intern) => {
          const corpusUserId = intern.corpusUserId || intern.internId;

          try {
            return await verifyStandupSubmission(corpusUserId, {
              uploadedOnDate: verificationDateKey,
              standupAliases: STANDUP_ALIAS_OVERRIDE,
              internshipAliases: INTERNSHIP_ALIAS_OVERRIDE,
            });
          } catch (error) {
            console.error(
              `Team verification failed for user "${corpusUserId}" (${teamId})`,
              error
            );

            return {
              internId: corpusUserId,
              validCount: 0,
              status: 'PENDING' as const,
              checkedDate: verificationDateKey,
              audios: [],
              slotStatuses: createMissingSlotStatuses(),
            };
          }
        })
      );

      const countByInternId = new Map(
        verificationResults.map((result) => [
          result.internId,
          result.validCount,
        ])
      );
      const audioByInternId = new Map(
        verificationResults.map((result) => [
          result.internId,
          result.audios ?? [],
        ])
      );
      const teamSlotStatuses = buildStandupSlotResults(
        verificationResults.flatMap((result) => result.audios ?? []),
        verificationDateKey
      );
      const teamTodayStandupCount =
        countCompletedStandupSlots(teamSlotStatuses);

      setManagedTeams((prev) =>
        prev.map((candidateTeam) => {
          if (candidateTeam.teamId !== teamId) {
            return candidateTeam;
          }

          return {
            ...candidateTeam,
            teamStatus:
              teamTodayStandupCount >= REQUIRED_TEAM_STANDUPS
                ? 'COMPLETED'
                : 'PENDING',
            todayStandupCount: teamTodayStandupCount,
            verifiedDate: verificationDateKey,
            requiredStandupCount: REQUIRED_TEAM_STANDUPS,
            teamSlotStatuses,
            interns: candidateTeam.interns.map((intern) => {
              const corpusUserId = intern.corpusUserId || intern.internId;
              const todayValidCount = countByInternId.get(corpusUserId) ?? 0;
              const slotStatuses =
                verificationResults.find(
                  (result) => result.internId === corpusUserId
                )?.slotStatuses ?? createMissingSlotStatuses();

              return {
                ...intern,
                todayValidCount,
                slotStatuses,
                audios: audioByInternId.get(corpusUserId) ?? [],
                status: todayValidCount > 0 ? 'COMPLETED' : 'PENDING',
              };
            }),
          };
        })
      );
    } finally {
      setVerifyingTeamId(null);
    }
  };

  const handleDeleteIntern = (internId: string) => {
    setManagedTeams((prev) =>
      prev.map((team) => {
        if (!team.interns.some((intern) => intern.internId === internId)) {
          return team;
        }

        return {
          ...team,
          teamStatus: 'PENDING',
          todayStandupCount: 0,
          verifiedDate: undefined,
          requiredStandupCount: REQUIRED_TEAM_STANDUPS,
          interns: team.interns.filter(
            (intern) => intern.internId !== internId
          ),
        };
      })
    );
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
          intern.internId === internId
            ? { ...intern, internName: trimmedName }
            : intern
        ),
      }))
    );
  };

  const handleDeleteTeam = (teamId: string) => {
    setManagedTeams((prev) => prev.filter((team) => team.teamId !== teamId));
  };

  const handleSelectedDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextDateKey = event.target.value;

    if (!nextDateKey) {
      return;
    }

    setSelectedDateKey(nextDateKey);
  };

  const handleUpdateTeamName = (teamId: string, newName: string) => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      return;
    }

    setManagedTeams((prev) =>
      prev.map((team) =>
        team.teamId === teamId ? { ...team, teamName: trimmedName } : team
      )
    );
  };

  const loadStatusSummaries = React.useCallback(async () => {
    const requestId = statusLoadRequestId.current + 1;
    statusLoadRequestId.current = requestId;

    if (managedTeams.length === 0) {
      setTeamDailyStatusRows([]);
      setTeamWeeklyStatusRows([]);
      setStatusError(null);
      setStatusLoading(false);
      return;
    }

    setStatusLoading(true);
    setStatusError(null);

    try {
      const aliasCriteria = buildSubmissionAliasCriteria(
        STANDUP_ALIAS_OVERRIDE,
        INTERNSHIP_ALIAS_OVERRIDE
      );
      const relevantDateKeys = new Set<string>(selectedWeekDateKeys);
      relevantDateKeys.add(selectedDateKey);
      const uniqueInternIds = collectUniqueTeamInternIds(managedTeams);
      const submissionSnapshot = await buildInternSubmissionSnapshot(
        uniqueInternIds,
        relevantDateKeys,
        aliasCriteria
      );

      if (statusLoadRequestId.current !== requestId) {
        return;
      }

      setTeamDailyStatusRows(
        managedTeams.map((team) =>
          buildTeamDailyStatusRow(
            team,
            selectedDateKey,
            submissionSnapshot.countsByInternByDate,
            submissionSnapshot.audiosByInternByDate
          )
        )
      );
      setTeamWeeklyStatusRows(
        managedTeams.map((team) =>
          buildTeamWeeklyStatusRow(
            team,
            selectedWeekDateKeys,
            submissionSnapshot.countsByInternByDate,
            submissionSnapshot.audiosByInternByDate
          )
        )
      );
    } catch (error) {
      if (statusLoadRequestId.current !== requestId) {
        return;
      }

      console.error('Unable to load team status summary', error);
      setStatusError(
        'Unable to load team status summary right now. Please refresh to try again.'
      );
      setTeamDailyStatusRows([]);
      setTeamWeeklyStatusRows([]);
    } finally {
      if (statusLoadRequestId.current === requestId) {
        setStatusLoading(false);
      }
    }
  }, [managedTeams, selectedDateKey, selectedWeekDateKeys]);

  React.useEffect(() => {
    if (!isStatusPanelOpen) {
      return;
    }

    void loadStatusSummaries();
  }, [isStatusPanelOpen, loadStatusSummaries]);

  React.useEffect(() => {
    if (!isStatusModalOpen) {
      return;
    }

    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStatusModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscapeClose);

    return () => {
      window.removeEventListener('keydown', handleEscapeClose);
    };
  }, [isStatusModalOpen]);

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
  };

  const renderStatusPanelContent = (isModalPanel: boolean) => (
    <>
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          {!isInlineStatusView ? (
            <h2 style={{ color: 'var(--text-main)', fontSize: 20, margin: 0 }}>
              Team Status Dashboard
            </h2>
          ) : null}
          <p style={{ color: 'var(--text-subtle)', fontSize: 13, margin: 0 }}>
            Daily date: {selectedDateLabel} | Weekly range: {selectedWeekLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="ghost-button"
            disabled={statusLoading}
            onClick={() => {
              void loadStatusSummaries();
            }}
            type="button"
          >
            {statusLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          {isModalPanel ? (
            <button
              className="ghost-button"
              onClick={handleCloseStatusModal}
              type="button"
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <section style={{ marginBottom: 4 }}>
        <label
          style={{
            color: 'var(--text-main)',
            display: 'grid',
            fontSize: 13,
            gap: 6,
            maxWidth: 280,
          }}
        >
          <span>Standup verification date</span>
          <input
            aria-label="Standup verification date"
            onChange={handleSelectedDateChange}
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-main)',
              fontSize: 14,
              padding: '10px 12px',
            }}
            type="date"
            value={selectedDateKey}
          />
        </label>
      </section>

      <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['DAILY', 'WEEKLY'] as const).map((viewKey) => {
          const isActive = statusView === viewKey;

          return (
            <button
              key={viewKey}
              onClick={() => setStatusView(viewKey)}
              style={{
                backgroundColor: isActive
                  ? 'var(--accent)'
                  : 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: isActive ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                padding: '8px 12px',
              }}
              type="button"
            >
              {viewKey === 'DAILY'
                ? 'Daily Standup Status'
                : 'Weekly Standup Status'}
            </button>
          );
        })}
      </section>

      {statusLoading ? (
        <p className="team-empty">Loading team status...</p>
      ) : null}
      {!statusLoading && statusError ? (
        <p className="team-empty">{statusError}</p>
      ) : null}
      {!statusLoading && !statusError && statusView === 'DAILY' ? (
        <section style={{ display: 'grid', gap: 14 }}>
          {teamDailyStatusRows.length === 0 ? (
            <p className="team-empty">
              No teams available for status tracking.
            </p>
          ) : (
            <section className="team-list">
              {teamDailyStatusRows.map((row) => (
                <article className="team-card" key={row.teamId}>
                  <header
                    style={{
                      alignItems: 'start',
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 3 }}>
                      <h3
                        className="team-name"
                        style={{ cursor: 'help' }}
                        title={formatContributorTooltip(row.contributorDetails)}
                      >
                        {row.teamName}
                      </h3>
                      <div className="team-id">
                        Progress: {row.standupCount}/{row.requiredStandupCount}
                      </div>
                    </div>
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: row.isCompleted
                          ? 'var(--success-bg)'
                          : 'var(--surface-2)',
                        border: `1px solid ${row.isCompleted ? 'var(--success-border)' : 'var(--border)'}`,
                        borderRadius: '9999px',
                        color: row.isCompleted
                          ? 'var(--success-text)'
                          : 'var(--text-subtle)',
                        display: 'inline-flex',
                        fontSize: 16,
                        height: 34,
                        justifyContent: 'center',
                        width: 34,
                      }}
                    >
                      {row.slotStatuses.map((slot) => (
                        <span
                          key={slot.slotId}
                          style={{
                            backgroundColor: getStatusSlotBackground(
                              slot.status
                            ),
                            border: `1px solid ${getStatusSlotBorder(slot.status)}`,
                            borderRadius: 9999,
                            color: getStatusSlotColor(slot.status),
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 8px',
                          }}
                          title={`${slot.label} (${slot.windowLabel})`}
                        >
                          {slot.slotId}
                        </span>
                      ))}
                    </div>
                  </header>
                </article>
              ))}
            </section>
          )}

          <section
            className="team-card"
            style={{ backgroundColor: 'var(--surface-1)' }}
          >
            <h3 className="team-name" style={{ marginBottom: 8 }}>
              Daily Pending Summary
            </h3>
            {pendingDailyRows.length === 0 ? (
              <p className="team-id">
                All teams completed required daily standups.
              </p>
            ) : (
              <ul
                style={{ display: 'grid', gap: 6, margin: 0, paddingLeft: 18 }}
              >
                {pendingDailyRows.map((row) => (
                  <li
                    key={row.teamId}
                    style={{ color: 'var(--text-subtle)', fontSize: 13 }}
                  >
                    {row.teamName}: {row.remainingStandupCount} standup(s)
                    pending
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      ) : null}

      {!statusLoading && !statusError && statusView === 'WEEKLY' ? (
        <section style={{ display: 'grid', gap: 14 }}>
          {teamWeeklyStatusRows.length === 0 ? (
            <p className="team-empty">
              No teams available for weekly status tracking.
            </p>
          ) : (
            <section className="team-list">
              {teamWeeklyStatusRows.map((row) => (
                <article className="team-card" key={row.teamId}>
                  <header style={{ marginBottom: 10 }}>
                    <h3 className="team-name">{row.teamName}</h3>
                    <div className="team-id">
                      Completed days: {row.completedDaysCount}/
                      {row.dayStatuses.length}
                    </div>
                  </header>

                  <section
                    style={{
                      display: 'grid',
                      gap: 8,
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(110px, 1fr))',
                    }}
                  >
                    {row.dayStatuses.map((dayStatus) => (
                      <article
                        key={dayStatus.dateKey}
                        style={{
                          backgroundColor: dayStatus.isCompleted
                            ? 'var(--success-bg)'
                            : 'var(--surface-1)',
                          border: `1px solid ${dayStatus.isCompleted ? 'var(--success-border)' : 'var(--border)'}`,
                          borderRadius: 8,
                          display: 'grid',
                          gap: 4,
                          padding: '8px 9px',
                        }}
                      >
                        <strong
                          style={{
                            color: 'var(--text-main)',
                            cursor: 'help',
                            fontSize: 12,
                          }}
                          title={formatContributorTooltip(
                            dayStatus.contributorDetails
                          )}
                        >
                          {dayStatus.dayLabel}
                        </strong>
                        <span
                          style={{ color: 'var(--text-subtle)', fontSize: 11 }}
                        >
                          {dayStatus.fullDateLabel}
                        </span>
                        <span
                          style={{ color: 'var(--text-main)', fontSize: 12 }}
                        >
                          {dayStatus.standupCount}/
                          {dayStatus.requiredStandupCount}
                        </span>
                      </article>
                    ))}
                  </section>

                  <section style={{ marginTop: 10 }}>
                    {row.pendingDayDetails.length === 0 ? (
                      <p className="team-id">No pending days for this week.</p>
                    ) : (
                      <p className="team-id">
                        Pending days: {row.pendingDayDetails.join(', ')}
                      </p>
                    )}
                  </section>
                </article>
              ))}
            </section>
          )}

          <section
            className="team-card"
            style={{ backgroundColor: 'var(--surface-1)' }}
          >
            <h3 className="team-name" style={{ marginBottom: 8 }}>
              Weekly Pending Summary
            </h3>
            {pendingWeeklyRows.length === 0 ? (
              <p className="team-id">
                All teams completed weekly standups for every day.
              </p>
            ) : (
              <ul
                style={{ display: 'grid', gap: 6, margin: 0, paddingLeft: 18 }}
              >
                {pendingWeeklyRows.map((row) => (
                  <li
                    key={row.teamId}
                    style={{ color: 'var(--text-subtle)', fontSize: 13 }}
                  >
                    {row.teamName}: {row.pendingDayDetails.join(', ')} |
                    Remaining: {row.totalRemainingStandups}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      ) : null}
    </>
  );

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          {isInlineStatusView ? 'Team Status Dashboard' : title}
        </h1>
        {!isInlineStatusView ? (
          <button
            className="primary-button"
            onClick={() => setIsCreatingTeam((prev) => !prev)}
            type="button"
          >
            {isCreatingTeam ? 'Cancel' : 'Create Team'}
          </button>
        ) : null}
      </header>

      {!isInlineStatusView ? (
        <>
          <section className="dashboard-view-switch" aria-label="View selector">
            {[
              { key: 'TEAMS' as const, label: 'Team Management' },
              { key: 'INTERNS' as const, label: 'Intern Directory' },
            ].map((item) => {
              const isActive = activeView === item.key;

              return (
                <button
                  className={`dashboard-view-button${isActive ? ' is-active' : ''}`}
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              );
            })}
          </section>

          {isCreatingTeam ? (
            <section
              style={{
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <input
                aria-label="New team name"
                className="team-search-input"
                onChange={(event) => setNewTeamName(event.target.value)}
                placeholder="Enter team name"
                style={{
                  minWidth: 260,
                }}
                type="text"
                value={newTeamName}
              />
              <button
                className="secondary-button"
                onClick={handleCreateTeam}
                type="button"
              >
                Add Team
              </button>
            </section>
          ) : null}

          <section style={{ marginBottom: 16 }}>
            <label
              style={{
                color: 'var(--text-main)',
                display: 'grid',
                fontSize: 13,
                gap: 6,
                maxWidth: 280,
              }}
            >
              <span>Standup verification date</span>
              <input
                aria-label="Standup verification date"
                className="date-input"
                onChange={handleSelectedDateChange}
                type="date"
                value={selectedDateKey}
              />
            </label>
          </section>

          <section style={{ marginBottom: 16 }}>
            <input
              aria-label="Search"
              className="team-search-input"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                activeView === 'TEAMS'
                  ? 'Search by team name...'
                  : 'Search by intern name or team name...'
              }
              type="text"
              value={searchTerm}
            />
          </section>

          {activeView === 'TEAMS' ? (
            <TeamList
              addedInterns={addedInterns}
              onAddInternToTeam={handleAddInternToTeam}
              onDeleteIntern={handleDeleteIntern}
              onDeleteTeam={handleDeleteTeam}
              onUpdateIntern={handleUpdateIntern}
              onUpdateTeamName={handleUpdateTeamName}
              onVerifyTeam={(teamId) => {
                void handleVerifyTeam(teamId);
              }}
              selectedDateLabel={selectedDateLabel}
              verifyingTeamId={verifyingTeamId}
              activeAudioId={activeAudioId}
              onPlay={(_internId, audioId) => setActiveAudioId(audioId)}
              onPause={() => setActiveAudioId(null)}
              teams={filteredTeams}
            />
          ) : null}

          {activeView !== 'TEAMS' ? (
            <section className="team-list">
              {filteredInternRows.length === 0 ? (
                <p className="team-empty">
                  {activeView === 'COMPLETED'
                    ? 'No completed interns found.'
                    : 'No interns found for the current search.'}
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
                      standupDateLabel={selectedDateLabel}
                      todayValidCount={intern.todayValidCount}
                      slotStatuses={intern.slotStatuses}
                      audios={intern.audios}
                      activeAudioId={activeAudioId}
                      onPlay={(_internId, audioId) => setActiveAudioId(audioId)}
                      onPause={() => setActiveAudioId(null)}
                    />
                  </article>
                ))
              )}
            </section>
          ) : null}
        </>
      ) : (
        <section style={{ display: 'grid', gap: 14 }}>
          {renderStatusPanelContent(false)}
        </section>
      )}

      {!isInlineStatusView && isStatusModalOpen ? (
        <div
          aria-modal="true"
          role="dialog"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            padding: '24px 14px',
            position: 'fixed',
            zIndex: 80,
          }}
        >
          <section
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'grid',
              gap: 14,
              maxHeight: '100%',
              maxWidth: 980,
              overflowY: 'auto',
              padding: 16,
              width: '100%',
            }}
          >
            {renderStatusPanelContent(true)}
          </section>
        </div>
      ) : null}
    </main>
  );
};

function buildTeamId(teamName: string, existingTeams: Team[]): string {
  const base = normalizeIdentifier(teamName) || 'team';
  const existingIds = new Set(existingTeams.map((team) => team.teamId));
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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseAliasEnv(rawAliases: string | undefined): string[] | undefined {
  if (!rawAliases) {
    return undefined;
  }

  const aliases = rawAliases
    .split(/[|,;/]+/g)
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);

  if (aliases.length === 0) {
    return undefined;
  }

  return Array.from(new Set(aliases));
}

function mergeAliases(
  baseAliases: string[],
  extraAliases: string[] | undefined
): string[] {
  return Array.from(new Set([...(baseAliases ?? []), ...(extraAliases ?? [])]));
}

function resetTeamVerification(team: Team): Team {
  return {
    ...team,
    teamStatus: 'PENDING',
    todayStandupCount: 0,
    verifiedDate: undefined,
    requiredStandupCount: REQUIRED_TEAM_STANDUPS,
    teamSlotStatuses: createMissingSlotStatuses(),
    interns: team.interns.map((intern) => ({
      ...intern,
      status: 'PENDING',
      teamProgressCount: 0,
      todayValidCount: 0,
      slotStatuses: createMissingSlotStatuses(),
    })),
  };
}

function normalizeTeamId(teamId: string | null | undefined): string {
  return (teamId ?? '').trim();
}

function buildTeamProgressById(
  teams: Team[]
): Map<
  string,
  { teamProgressCount: number; teamStatus: 'COMPLETED' | 'PENDING' }
> {
  const progressByTeamId = new Map<
    string,
    { teamProgressCount: number; teamStatus: 'COMPLETED' | 'PENDING' }
  >();

  for (const team of teams) {
    const normalizedTeamId = normalizeTeamId(team.teamId);

    if (!normalizedTeamId) {
      continue;
    }

    const requiredStandupCount =
      team.requiredStandupCount ?? REQUIRED_TEAM_STANDUPS;
    const teamProgressCount = Math.min(
      team.interns.reduce(
        (total, intern) => total + (intern.todayValidCount ?? 0),
        0
      ),
      requiredStandupCount
    );

    progressByTeamId.set(normalizedTeamId, {
      teamProgressCount,
      teamStatus: teamProgressCount > 0 ? 'COMPLETED' : 'PENDING',
    });
  }

  return progressByTeamId;
}

function deriveTeamWithTeamProgress(
  team: Team,
  teamProgressById: Map<
    string,
    { teamProgressCount: number; teamStatus: 'COMPLETED' | 'PENDING' }
  >
): Team {
  const normalizedTeamId = normalizeTeamId(team.teamId);

  if (!normalizedTeamId) {
    return team;
  }

  const teamProgress = teamProgressById.get(normalizedTeamId);

  if (!teamProgress) {
    return team;
  }

  const requiredStandupCount =
    team.requiredStandupCount ?? REQUIRED_TEAM_STANDUPS;

  return {
    ...team,
    teamStatus: teamProgress.teamStatus,
    todayStandupCount: teamProgress.teamProgressCount,
    requiredStandupCount,
    interns: team.interns.map((intern) => ({
      ...intern,
      status: teamProgress.teamStatus,
      teamProgressCount: teamProgress.teamProgressCount,
    })),
  };
}

function createMissingSlotStatuses(): StandupSlotResult[] {
  return buildStandupSlotResults([], '');
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateKey: string): string {
  const parsedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

function collectUniqueTeamInternIds(teams: Team[]): string[] {
  const uniqueIds = new Set<string>();

  for (const team of teams) {
    for (const intern of team.interns) {
      const corpusUserId = (
        intern.corpusUserId ||
        intern.internId ||
        ''
      ).trim();

      if (corpusUserId) {
        uniqueIds.add(corpusUserId);
      }
    }
  }

  return Array.from(uniqueIds);
}

interface InternSubmissionSnapshot {
  countsByInternByDate: Map<string, Map<string, number>>;
  audiosByInternByDate: Map<string, Map<string, InternAudioMetadata[]>>;
}

async function buildInternSubmissionSnapshot(
  internIds: string[],
  targetDateKeys: Set<string>,
  criteria: SubmissionAliasCriteria
): Promise<InternSubmissionSnapshot> {
  const entries: Array<
    readonly [string, Map<string, number>, Map<string, InternAudioMetadata[]>]
  > = [];

  for (
    let batchStartIndex = 0;
    batchStartIndex < internIds.length;
    batchStartIndex += STATUS_FETCH_BATCH_SIZE
  ) {
    const batchInternIds = internIds.slice(
      batchStartIndex,
      batchStartIndex + STATUS_FETCH_BATCH_SIZE
    );
    const batchEntries = await Promise.all(
      batchInternIds.map((internId) =>
        fetchInternContributionWithRetries(internId, targetDateKeys, criteria)
      )
    );

    entries.push(...batchEntries);
  }

  return {
    countsByInternByDate: new Map(
      entries.map(([internId, dateCounts]) => [internId, dateCounts])
    ),
    audiosByInternByDate: new Map(
      entries.map(([internId, _dateCounts, dateAudios]) => [
        internId,
        dateAudios,
      ])
    ),
  };
}

function buildTeamDailyStatusRow(
  team: Team,
  dateKey: string,
  countsByInternByDate: Map<string, Map<string, number>>,
  audiosByInternByDate: Map<string, Map<string, InternAudioMetadata[]>>
): TeamDailyStatusRow {
  const requiredStandupCount =
    team.requiredStandupCount ?? REQUIRED_TEAM_STANDUPS;
  const slotStatuses = buildStandupSlotResults(
    collectTeamAudiosForDate(team, dateKey, audiosByInternByDate),
    dateKey
  );
  const totalStandupCount = countCompletedStandupSlots(slotStatuses);
  const cappedStandupCount = Math.min(totalStandupCount, requiredStandupCount);
  const remainingStandupCount = Math.max(
    requiredStandupCount - totalStandupCount,
    0
  );
  const contributorDetails = buildContributorDetailsForDate(
    team,
    dateKey,
    countsByInternByDate
  );

  return {
    teamId: team.teamId,
    teamName: team.teamName,
    standupCount: cappedStandupCount,
    requiredStandupCount,
    remainingStandupCount,
    isCompleted: totalStandupCount >= requiredStandupCount,
    slotStatuses,
    contributorDetails,
  };
}

function buildTeamWeeklyStatusRow(
  team: Team,
  weekDateKeys: string[],
  countsByInternByDate: Map<string, Map<string, number>>,
  audiosByInternByDate: Map<string, Map<string, InternAudioMetadata[]>>
): TeamWeeklyStatusRow {
  const requiredStandupCount =
    team.requiredStandupCount ?? REQUIRED_TEAM_STANDUPS;
  const dayStatuses = weekDateKeys.map((dateKey) => {
    const slotStatuses = buildStandupSlotResults(
      collectTeamAudiosForDate(team, dateKey, audiosByInternByDate),
      dateKey
    );
    const totalStandupCount = countCompletedStandupSlots(slotStatuses);
    const cappedStandupCount = Math.min(
      totalStandupCount,
      requiredStandupCount
    );
    const remainingStandupCount = Math.max(
      requiredStandupCount - totalStandupCount,
      0
    );
    const contributorDetails = buildContributorDetailsForDate(
      team,
      dateKey,
      countsByInternByDate
    );

    return {
      dateKey,
      dayLabel: formatWeekdayShort(dateKey),
      fullDateLabel: formatMonthDay(dateKey),
      standupCount: cappedStandupCount,
      requiredStandupCount,
      remainingStandupCount,
      isCompleted: totalStandupCount >= requiredStandupCount,
      contributorDetails,
    };
  });
  const completedDaysCount = dayStatuses.filter(
    (status) => status.isCompleted
  ).length;
  const pendingDayDetails = dayStatuses
    .filter((status) => !status.isCompleted)
    .map(
      (status) => `${status.dayLabel} (${status.remainingStandupCount} pending)`
    );
  const totalRemainingStandups = dayStatuses.reduce(
    (total, status) => total + status.remainingStandupCount,
    0
  );

  return {
    teamId: team.teamId,
    teamName: team.teamName,
    dayStatuses,
    completedDaysCount,
    pendingDayDetails,
    totalRemainingStandups,
  };
}

function collectTeamAudiosForDate(
  team: Team,
  dateKey: string,
  audiosByInternByDate: Map<string, Map<string, InternAudioMetadata[]>>
): InternAudioMetadata[] {
  return getTeamInternIds(team).flatMap(
    (internId) => audiosByInternByDate.get(internId)?.get(dateKey) ?? []
  );
}

function buildContributorDetailsForDate(
  team: Team,
  dateKey: string,
  countsByInternByDate: Map<string, Map<string, number>>
): ContributorUploadDetail[] {
  return getTeamInternEntries(team)
    .map((intern) => ({
      internId: intern.internId,
      internName: intern.internName,
      uploadCount: countsByInternByDate.get(intern.internId)?.get(dateKey) ?? 0,
    }))
    .filter((entry) => entry.uploadCount > 0)
    .sort((left, right) => right.uploadCount - left.uploadCount);
}

function getTeamInternIds(team: Team): string[] {
  return getTeamInternEntries(team).map((entry) => entry.internId);
}

function getTeamInternEntries(
  team: Team
): Array<Pick<ContributorUploadDetail, 'internId' | 'internName'>> {
  return team.interns
    .map((intern) => {
      const internId = (intern.corpusUserId || intern.internId || '').trim();
      const internName = (intern.internName || '').trim() || internId;

      if (!internId) {
        return null;
      }

      return { internId, internName };
    })
    .filter(
      (
        entry
      ): entry is Pick<ContributorUploadDetail, 'internId' | 'internName'> =>
        entry !== null
    );
}

function getWeekDateKeys(anchorDateKey: string): string[] {
  const anchorDate = new Date(`${anchorDateKey}T00:00:00`);

  if (Number.isNaN(anchorDate.getTime())) {
    return [];
  }

  const anchorWeekday = anchorDate.getDay();
  const daysSinceMonday = (anchorWeekday + 6) % 7;
  const weekStart = new Date(anchorDate);
  weekStart.setDate(anchorDate.getDate() - daysSinceMonday);

  const weekDateKeys: string[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + offset);
    weekDateKeys.push(getLocalDateKey(day));
  }

  return weekDateKeys;
}

function formatWeekRangeLabel(weekDateKeys: string[]): string {
  if (weekDateKeys.length === 0) {
    return 'Invalid week';
  }

  const start = formatMonthDay(weekDateKeys[0]);
  const end = formatMonthDay(weekDateKeys[weekDateKeys.length - 1]);

  return `${start} - ${end}`;
}

function formatWeekdayShort(dateKey: string): string {
  const parsedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    parsedDate
  );
}

function formatMonthDay(dateKey: string): string {
  const parsedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
  }).format(parsedDate);
}

function formatContributorTooltip(
  contributors: ContributorUploadDetail[]
): string {
  if (contributors.length === 0) {
    return 'No uploads for this selection.';
  }

  return contributors
    .map(
      (contributor) => `${contributor.internName}: ${contributor.uploadCount}`
    )
    .join(' | ');
}

function getStatusSlotBackground(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return '#dcfce7';
  }

  if (status === 'DELAYED') {
    return '#fef3c7';
  }

  return '#f1f5f9';
}

function getStatusSlotBorder(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return '#86efac';
  }

  if (status === 'DELAYED') {
    return '#fcd34d';
  }

  return '#cbd5e1';
}

function getStatusSlotColor(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return '#166534';
  }

  if (status === 'DELAYED') {
    return '#92400e';
  }

  return '#475569';
}

async function fetchInternContributionWithRetries(
  internId: string,
  targetDateKeys: Set<string>,
  criteria: SubmissionAliasCriteria
): Promise<
  readonly [string, Map<string, number>, Map<string, InternAudioMetadata[]>]
> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_INTERN_FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await collectInternContributionData(
        internId,
        targetDateKeys,
        criteria
      );
    } catch (error) {
      lastError = error;

      if (attempt === MAX_INTERN_FETCH_ATTEMPTS) {
        console.error(
          `Unable to load contributions for "${internId}" after ${MAX_INTERN_FETCH_ATTEMPTS} attempts`,
          error
        );
        throw error instanceof Error
          ? error
          : new Error(`Unable to load contributions for "${internId}".`);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to load intern contributions.');
}

async function collectInternContributionData(
  internId: string,
  targetDateKeys: Set<string>,
  criteria: SubmissionAliasCriteria
): Promise<
  readonly [string, Map<string, number>, Map<string, InternAudioMetadata[]>]
> {
  const audios = await getInternAudios(internId);
  const dateCounts = new Map<string, number>();
  const dateAudios = new Map<string, InternAudioMetadata[]>();

  for (const audio of audios) {
    if (!audioMatchesSubmissionCriteria(audio, criteria)) {
      continue;
    }

    const uploadedDateKey = resolveUploadedDateKey(audio.uploadedAt);

    if (!uploadedDateKey || !targetDateKeys.has(uploadedDateKey)) {
      continue;
    }

    dateCounts.set(uploadedDateKey, (dateCounts.get(uploadedDateKey) ?? 0) + 1);
    dateAudios.set(uploadedDateKey, [
      ...(dateAudios.get(uploadedDateKey) ?? []),
      audio,
    ]);
  }

  return [internId, dateCounts, dateAudios];
}

function buildSubmissionAliasCriteria(
  standupAliases: string[],
  internshipAliases: string[]
): SubmissionAliasCriteria {
  return {
    standupAliases: toComparableAliasSet(standupAliases),
    internshipAliases: toComparableAliasSet(internshipAliases),
  };
}

function toComparableAliasSet(aliases: string[]): Set<string> {
  const comparableAliases = new Set<string>();

  for (const alias of aliases) {
    for (const token of splitAliasTokens(alias)) {
      const normalizedAlias = normalizeComparableText(token);

      if (normalizedAlias) {
        comparableAliases.add(normalizedAlias);
      }
    }
  }

  return comparableAliases;
}

function audioMatchesSubmissionCriteria(
  audio: Pick<InternAudioMetadata, 'category' | 'tag'> &
    Partial<Pick<InternAudioMetadata, 'labels'>>,
  criteria: SubmissionAliasCriteria
): boolean {
  return isValidStandupSubmissionAudio(audio, criteria);
}

function splitAliasTokens(value: string): string[] {
  return value
    .split(/[\s|,;/]+/g)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function normalizeComparableText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function resolveUploadedDateKey(
  uploadedAt: string | undefined
): string | undefined {
  if (!uploadedAt) {
    return undefined;
  }

  const parsedDate = parseTimestamp(uploadedAt);

  if (!parsedDate) {
    return undefined;
  }

  return getDateKeyInTimeZone(parsedDate, STANDUP_TIME_ZONE);
}

export default DashboardLayout;
