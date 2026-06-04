import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, X, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import TeamList, { Team } from './TeamList';
import TeamStatusRing from './TeamStatusRing';
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
import { RecordStandupModal } from '../RecordStandupModal';

type DashboardView = 'TEAMS' | 'INTERNS' | 'COMPLETED';
type StatusView = 'DAILY' | 'WEEKLY';
type AnalyticsQualityFilter = 'ALL' | 'GOOD' | 'DELAYED' | 'MISSING';

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
  slotStatuses: StandupSlotResult[];
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

interface TeamAnalyticsQualityRow {
  teamId: string;
  teamName: string;
  goodCount: number;
  delayedCount: number;
  missingCount: number;
  score: number;
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
  statusDisplay?: 'modal' | 'inline';
  mode?: 'teams' | 'status' | 'analytics';
  authToken?: string;
  canManageStandup?: boolean;
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
  statusDisplay = 'modal',
  mode = 'teams',
  authToken,
  canManageStandup = false,
}) => {
  const { t } = useTranslation();
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
  const [analyticsQualityFilter, setAnalyticsQualityFilter] =
    React.useState<AnalyticsQualityFilter>('ALL');
  const [showDailyChart, setShowDailyChart] = React.useState(false);
  const [activeAudioId, setActiveAudioId] = React.useState<string | null>(null);
  const [statusLoading, setStatusLoading] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [teamDailyStatusRows, setTeamDailyStatusRows] = React.useState<
    TeamDailyStatusRow[]
  >([]);
  const [teamWeeklyStatusRows, setTeamWeeklyStatusRows] = React.useState<
    TeamWeeklyStatusRow[]
  >([]);
  const [analyticsTeamDailyTotals, setAnalyticsTeamDailyTotals] =
    React.useState<Map<string, Map<string, number>>>(new Map());
  const [analyticsQualityRows, setAnalyticsQualityRows] = React.useState<
    TeamAnalyticsQualityRow[]
  >([]);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(
    null
  );
  const [isRecordModalOpen, setIsRecordModalOpen] = React.useState(false);
  const hasInitializedDateSelection = React.useRef(false);
  const statusLoadRequestId = React.useRef(0);
  const analyticsLoadRequestId = React.useRef(0);

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
    () =>
      formatWeekRangeLabel(selectedWeekDateKeys, t('dashboard.invalidWeek')),
    [selectedWeekDateKeys, t]
  );
  const analyticsDateKeys = React.useMemo(
    () => getTrailingDateKeys(selectedDateKey, 29),
    [selectedDateKey]
  );
  const teamMemberNamesById = React.useMemo(
    () =>
      new Map(
        managedTeams.map((team) => [team.teamId, getTeamMemberNames(team)])
      ),
    [managedTeams]
  );
  const pendingWeeklyRows = React.useMemo(
    () =>
      teamWeeklyStatusRows.filter((row) => row.pendingDayDetails.length > 0),
    [teamWeeklyStatusRows]
  );
  const isInlineStatusView = statusDisplay === 'inline';
  const isStatusPanelOpen = isInlineStatusView || isStatusModalOpen;
  const isAnalyticsView = mode === 'analytics';

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
  const rankedAnalyticsTeams = React.useMemo(() => {
    const teamById = new Map(managedTeams.map((team) => [team.teamId, team]));

    return rankAnalyticsQualityRows(
      analyticsQualityRows,
      analyticsQualityFilter
    )
      .map((row) => teamById.get(row.teamId))
      .filter((team): team is Team => team !== undefined);
  }, [analyticsQualityFilter, analyticsQualityRows, managedTeams]);

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

  const handleUploadSuccess = () => {
    setIsRecordModalOpen(false);
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

  const handleShiftAnalyticsRange = (days: number) => {
    const currentDate = new Date(`${selectedDateKey}T00:00:00`);

    if (Number.isNaN(currentDate.getTime())) {
      return;
    }

    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDateKey(getLocalDateKey(currentDate));
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
            submissionSnapshot.audiosByInternByDate,
            t('dashboard.pending')
          )
        )
      );
    } catch (error) {
      if (statusLoadRequestId.current !== requestId) {
        return;
      }

      console.error('Unable to load team status summary', error);
      setStatusError(t('dashboard.unableToLoadTeamStatusSummary'));
      setTeamDailyStatusRows([]);
      setTeamWeeklyStatusRows([]);
    } finally {
      if (statusLoadRequestId.current === requestId) {
        setStatusLoading(false);
      }
    }
  }, [managedTeams, selectedDateKey, selectedWeekDateKeys, t]);

  const loadAnalytics = React.useCallback(async () => {
    const requestId = analyticsLoadRequestId.current + 1;
    analyticsLoadRequestId.current = requestId;

    const validTeams = managedTeams.filter((team) =>
      Boolean(normalizeTeamId(team.teamId))
    );

    if (validTeams.length === 0) {
      setAnalyticsTeamDailyTotals(new Map());
      setAnalyticsQualityRows([]);
      setAnalyticsError(null);
      setAnalyticsLoading(false);
      return;
    }

    setAnalyticsLoading(true);
    setAnalyticsError(null);

    try {
      const aliasCriteria = buildSubmissionAliasCriteria(
        STANDUP_ALIAS_OVERRIDE,
        INTERNSHIP_ALIAS_OVERRIDE
      );
      const targetDateKeys = new Set<string>(analyticsDateKeys);
      const uniqueInternIds = collectUniqueTeamInternIds(validTeams);
      const { countsByInternByDate, audiosByInternByDate } =
        await buildInternSubmissionSnapshot(
          uniqueInternIds,
          targetDateKeys,
          aliasCriteria
        );

      if (analyticsLoadRequestId.current !== requestId) {
        return;
      }

      const teamTotals = new Map<string, Map<string, number>>();
      const qualityRows: TeamAnalyticsQualityRow[] = [];

      for (const team of validTeams) {
        const teamId = normalizeTeamId(team.teamId);
        const teamDateCounts = new Map<string, number>();

        for (const dateKey of analyticsDateKeys) {
          const teamCount = sumTeamStandupsForDate(
            team,
            dateKey,
            countsByInternByDate
          );
          teamDateCounts.set(
            dateKey,
            Math.min(teamCount, REQUIRED_TEAM_STANDUPS)
          );
        }

        teamTotals.set(teamId, teamDateCounts);
        qualityRows.push(
          buildTeamAnalyticsQualityRow(
            team,
            analyticsDateKeys,
            audiosByInternByDate
          )
        );
      }

      setAnalyticsTeamDailyTotals(teamTotals);
      setAnalyticsQualityRows(qualityRows);
    } catch (error) {
      if (analyticsLoadRequestId.current !== requestId) {
        return;
      }

      console.error('Unable to load analytics', error);
      setAnalyticsError(t('dashboard.unableToLoadAnalytics'));
      setAnalyticsTeamDailyTotals(new Map());
      setAnalyticsQualityRows([]);
    } finally {
      if (analyticsLoadRequestId.current === requestId) {
        setAnalyticsLoading(false);
      }
    }
  }, [analyticsDateKeys, managedTeams, t]);

  React.useEffect(() => {
    if (!isStatusPanelOpen) {
      return;
    }

    void loadStatusSummaries();
  }, [isStatusPanelOpen, loadStatusSummaries]);

  React.useEffect(() => {
    if (!isAnalyticsView) {
      return;
    }

    void loadAnalytics();
  }, [isAnalyticsView, loadAnalytics]);

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
      <header className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="grid gap-1.5">
          {!isInlineStatusView ? (
            <h2 className="text-[var(--text-main)] text-xl m-0 font-extrabold tracking-tight">
              {t('dashboard.teamStatusDashboard')}
            </h2>
          ) : null}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-500/5 dark:bg-white/5 border border-slate-500/10 dark:border-white/5 text-[var(--text-subtle)] text-[12px] font-semibold tracking-wide backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {t('dashboard.dailyDateWeeklyRange', {
                daily: selectedDateLabel,
                weekly: selectedWeekLabel,
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="ghost-button flex items-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-xl border border-slate-500/10 dark:border-white/5"
            disabled={statusLoading}
            onClick={() => {
              void loadStatusSummaries();
            }}
            type="button"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`}
            />
            <span>
              {statusLoading ? t('dashboard.refreshing') : t('button.refresh')}
            </span>
          </button>
          {isModalPanel ? (
            <button
              className="ghost-button py-2 px-4 text-xs font-semibold rounded-xl border border-slate-500/10 dark:border-white/5"
              onClick={handleCloseStatusModal}
              type="button"
            >
              {t('button.close')}
            </button>
          ) : null}
        </div>
      </header>

      <section className="mb-4 mt-2">
        <label className="grid gap-2 max-w-[320px]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
            {t('dashboard.standupVerificationDate')}
          </span>
          <div className="relative flex items-center">
            <input
              aria-label={t('dashboard.standupVerificationDate')}
              onChange={handleSelectedDateChange}
              className="w-full bg-slate-500/5 dark:bg-white/5 border border-slate-500/15 dark:border-white/10 rounded-xl text-[var(--text-main)] text-sm px-4 py-3 transition-all duration-200 outline-none hover:border-blue-500/35 focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.12)] cursor-pointer"
              type="date"
              value={selectedDateKey}
              style={{
                colorScheme:
                  typeof document !== 'undefined' &&
                  document.documentElement.getAttribute('data-theme') === 'dark'
                    ? 'dark'
                    : 'light',
              }}
            />
          </div>
        </label>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 py-3 border-t border-slate-500/5 dark:border-white/5 mt-2">
        <div className="flex p-1 bg-slate-500/5 dark:bg-slate-950/20 border border-slate-500/15 dark:border-white/10 rounded-full backdrop-blur-md">
          {(['DAILY', 'WEEKLY'] as const).map((viewKey) => {
            const isActive = statusView === viewKey;

            return (
              <button
                key={viewKey}
                onClick={() => setStatusView(viewKey)}
                className={`flex items-center gap-1.5 px-5 py-2.5 border-none rounded-full text-xs font-semibold cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.25)]'
                    : 'bg-transparent text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                type="button"
              >
                {viewKey === 'DAILY' ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Daily Standup Status</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Weekly Standup Status</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {isInlineStatusView && statusView === 'DAILY' ? (
          <button
            className="ghost-button flex items-center gap-1.5 py-2.5 px-5 text-xs font-semibold rounded-full border border-slate-500/15 dark:border-white/10"
            onClick={() => setShowDailyChart((prev) => !prev)}
            type="button"
          >
            <span>{showDailyChart ? 'Hide Chart' : 'Show Chart'}</span>
          </button>
        ) : null}
      </section>

      {statusLoading ? (
        <p className="team-empty">{t('dashboard.loadingTeamStatus')}</p>
      ) : null}
      {!statusLoading && statusError ? (
        <p className="team-empty">{statusError}</p>
      ) : null}

      {!statusLoading &&
      !statusError &&
      isInlineStatusView &&
      statusView === 'DAILY' &&
      showDailyChart &&
      teamDailyStatusRows.length > 0 ? (
        <section
          className="status-glance-panel"
          aria-label={t('dashboard.atAGlanceStatisticsAria')}
        >
          <header className="status-glance-header">
            <h3 className="status-glance-title">
              {t('dashboard.atAGlanceStatisticsTitle')}
            </h3>
            <p className="status-glance-copy">
              {t('dashboard.hoverTeamRingToViewMembers')}
            </p>
          </header>

          <section className="status-glance-grid">
            {teamDailyStatusRows.map((row) => (
              <TeamStatusRing
                key={row.teamId}
                memberNames={teamMemberNamesById.get(row.teamId) ?? []}
                requiredStandupCount={row.requiredStandupCount}
                slotStatuses={row.slotStatuses}
                standupCount={row.standupCount}
                teamName={row.teamName}
              />
            ))}
          </section>
        </section>
      ) : null}

      {!statusLoading &&
      !statusError &&
      statusView === 'DAILY' &&
      (!isInlineStatusView || !showDailyChart) ? (
        <section className="grid gap-3.5">
          {teamDailyStatusRows.length === 0 ? (
            <p className="team-empty">
              {t('dashboard.noTeamsForStatusTracking')}
            </p>
          ) : (
            <section className="team-list">
              {teamDailyStatusRows.map((row) => (
                <article className="team-card" key={row.teamId}>
                  <header className="flex items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <h3
                        className="team-name cursor-help"
                        title={formatContributorTooltip(
                          row.contributorDetails,
                          t('dashboard.noUploadsForSelection')
                        )}
                      >
                        {row.teamName}
                      </h3>
                      <div className="team-id">
                        {t('dashboard.progressLabel')}: {row.standupCount}/
                        {row.requiredStandupCount}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[280px]">
                      {row.slotStatuses.map((slot) => (
                        <span
                          key={slot.slotId}
                          className="inline-flex justify-center items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md transition-all duration-200"
                          style={{
                            backgroundColor: getStatusSlotBackground(
                              slot.status
                            ),
                            borderColor: getStatusSlotBorder(slot.status),
                            color: getStatusSlotColor(slot.status),
                          }}
                          title={`${slot.label} (${slot.windowLabel}): ${slot.status}`}
                        >
                          {renderSlotIcon(slot.status)}
                          <span>{getSlotTimeLabel(slot.slotId)}</span>
                        </span>
                      ))}
                    </div>
                  </header>
                </article>
              ))}
            </section>
          )}
        </section>
      ) : null}

      {!statusLoading && !statusError && statusView === 'WEEKLY' ? (
        <section className="grid gap-3.5">
          {teamWeeklyStatusRows.length === 0 ? (
            <p className="team-empty">
              {t('dashboard.noTeamsForWeeklyStatusTracking')}
            </p>
          ) : (
            <section className="team-list">
              {teamWeeklyStatusRows.map((row) => (
                <article className="team-card" key={row.teamId}>
                  <header className="mb-2.5">
                    <h3 className="team-name">{row.teamName}</h3>
                    <div className="team-id">
                      {t('dashboard.completedDays')}: {row.completedDaysCount}/
                      {row.dayStatuses.length}
                    </div>
                  </header>

                  <section className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
                    {row.dayStatuses.map((dayStatus) => (
                      <article
                        key={dayStatus.dateKey}
                        className={`grid gap-1 p-[8px_9px] rounded-lg border ${
                          dayStatus.isCompleted
                            ? 'bg-[var(--success-bg)] border-[var(--success-border)]'
                            : 'bg-[var(--surface-1)] border-[var(--border)]'
                        }`}
                      >
                        <strong
                          className="text-[var(--text-main)] cursor-help text-xs"
                          title={formatContributorTooltip(
                            dayStatus.contributorDetails,
                            t('dashboard.noUploadsForSelection')
                          )}
                        >
                          {dayStatus.dayLabel}
                        </strong>
                        <span className="text-[var(--text-subtle)] text-[11px]">
                          {dayStatus.fullDateLabel}
                        </span>
                        <span className="text-[var(--text-main)] text-xs">
                          {dayStatus.standupCount}/
                          {dayStatus.requiredStandupCount}
                        </span>
                      </article>
                    ))}
                  </section>

                  <section className="mt-2.5">
                    {row.pendingDayDetails.length === 0 ? (
                      <p className="team-id">
                        {t('dashboard.noPendingDaysForWeek')}
                      </p>
                    ) : (
                      <p className="team-id">
                        {t('dashboard.pendingDays')}:{' '}
                        {row.pendingDayDetails.join(', ')}
                      </p>
                    )}
                  </section>
                </article>
              ))}
            </section>
          )}

          <section className="team-card bg-[var(--surface-1)]">
            <h3 className="team-name mb-2">
              {t('dashboard.weeklyPendingSummary')}
            </h3>
            {pendingWeeklyRows.length === 0 ? (
              <p className="team-id">
                {t('dashboard.allTeamsCompletedWeeklyStandups')}
              </p>
            ) : (
              <ul className="grid gap-1.5 m-0 pl-4.5">
                {pendingWeeklyRows.map((row) => (
                  <li
                    key={row.teamId}
                    className="text-[var(--text-subtle)] text-[13px]"
                  >
                    {row.teamName}: {row.pendingDayDetails.join(', ')} |
                    {t('dashboard.remaining')}: {row.totalRemainingStandups}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      ) : null}
    </>
  );

  const renderAnalyticsContent = () => {
    return (
      <section className="grid gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-[var(--text-main)] text-xl m-0">
              {t('dashboard.teamAnalytics')}
            </h2>
            <p className="text-[#475569] text-[13px] m-0">
              {t('dashboard.dailyUploadsAcrossAllTeamsRange', {
                start: formatDateForDisplay(analyticsDateKeys[0]),
                end: formatDateForDisplay(
                  analyticsDateKeys[analyticsDateKeys.length - 1]
                ),
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-[#475569] text-xs min-w-[170px]">
              <span>{t('dashboard.customDate')}</span>
              <input
                aria-label={t('dashboard.customDate')}
                className="date-input"
                onChange={handleSelectedDateChange}
                type="date"
                value={selectedDateKey}
              />
            </label>
            <button
              className="ghost-button"
              onClick={() => handleShiftAnalyticsRange(-30)}
              type="button"
            >
              {t('dashboard.previousRange')}
            </button>
            <button
              className="ghost-button"
              onClick={() => handleShiftAnalyticsRange(30)}
              type="button"
            >
              {t('dashboard.nextRange')}
            </button>
            <button
              className="ghost-button"
              disabled={analyticsLoading}
              onClick={() => {
                void loadAnalytics();
              }}
              type="button"
            >
              {analyticsLoading
                ? t('dashboard.refreshing')
                : t('button.refresh')}
            </button>
          </div>
        </header>

        {analyticsLoading ? (
          <p className="team-empty">{t('dashboard.loadingAnalytics')}</p>
        ) : null}
        {!analyticsLoading && analyticsError ? (
          <p className="team-empty">{analyticsError}</p>
        ) : null}

        {!analyticsLoading && !analyticsError ? (
          <section className="team-card bg-[#f8fafc] overflow-x-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="team-name m-0">
                    {t('dashboard.memberActivityHeatmap')}
                  </h3>
                  {(
                    [
                      ['ALL', t('dashboard.filterAll')],
                      ['GOOD', t('dashboard.filterGood')],
                      ['DELAYED', t('dashboard.filterDelayed')],
                      ['MISSING', t('dashboard.filterMissing')],
                    ] as Array<[AnalyticsQualityFilter, string]>
                  ).map(([filterKey, label]) => {
                    const isActive = analyticsQualityFilter === filterKey;

                    return (
                      <button
                        key={filterKey}
                        onClick={() => setAnalyticsQualityFilter(filterKey)}
                        className={getFilterButtonClass(isActive)}
                        type="button"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="team-id m-0">
                  {t('dashboard.dailyUploadsPerTeamMax')}
                </p>
              </div>
            </div>

            {renderTeamHeatmap(
              rankedAnalyticsTeams,
              [...analyticsDateKeys].reverse(),
              analyticsTeamDailyTotals,
              t('dashboard.noLeaderboardResults'),
              t('dashboard.scrollToViewMore'),
              t('dashboard.teamColumn')
            )}
          </section>
        ) : null}
      </section>
    );
  };

  return (
    <div className="w-full">
      {/* KPI Summary Cards */}
      {!isInlineStatusView && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            className="glass-card p-5 flex flex-col justify-between"
            style={{ padding: '20px' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
              {t('dashboard.totalTeams', 'Total Teams')}
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <strong className="text-2xl font-extrabold text-[var(--text-main)]">
                {displayTeams.length}
              </strong>
              <span className="text-xs text-blue-500 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>
          <div
            className="glass-card p-5 flex flex-col justify-between"
            style={{ padding: '20px' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
              {t('dashboard.totalInterns', 'Total Interns')}
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <strong className="text-2xl font-extrabold text-[var(--text-main)]">
                {allInternRows.length}
              </strong>
              <span className="text-xs text-indigo-500 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                Enrolled
              </span>
            </div>
          </div>
          <div
            className="glass-card p-5 flex flex-col justify-between"
            style={{ padding: '20px' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
              {t('dashboard.standupCompletionRate', 'Completion Rate')}
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <strong className="text-2xl font-extrabold text-[var(--text-main)]">
                {displayTeams.length > 0
                  ? Math.round(
                      (displayTeams.filter((t) => t.teamStatus === 'COMPLETED')
                        .length /
                        displayTeams.length) *
                        105 /* Math.min to cap at 100 below */
                    ) > 100
                    ? 100
                    : Math.round(
                        (displayTeams.filter(
                          (t) => t.teamStatus === 'COMPLETED'
                        ).length /
                          displayTeams.length) *
                          100
                      )
                  : 0}
                %
              </strong>
              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                  style={{
                    width: `${
                      displayTeams.length > 0
                        ? Math.round(
                            (displayTeams.filter(
                              (t) => t.teamStatus === 'COMPLETED'
                            ).length /
                              displayTeams.length) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isInlineStatusView ? (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <section
            className="flex glass p-1 max-w-fit w-full sm:w-auto rounded-full"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
            aria-label={t('dashboard.viewSelector')}
          >
            {[
              { key: 'TEAMS' as const, label: t('dashboard.teamManagement') },
              {
                key: 'INTERNS' as const,
                label: t('dashboard.internDirectory'),
              },
            ].map((item) => {
              const isActive = activeView === item.key;

              return (
                <button
                  className={`px-5 py-2 border border-transparent rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-transparent text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              );
            })}
          </section>

          <div className="flex gap-3">
            <button
              className="secondary-button"
              onClick={() => setIsRecordModalOpen(true)}
              type="button"
            >
              Record Standup
            </button>
            {canManageStandup ? (
              <button
                className="primary-button"
                onClick={() => setIsCreatingTeam((prev) => !prev)}
                type="button"
              >
                {isCreatingTeam ? t('button.cancel') : t('teams.createTeam')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isAnalyticsView ? (
        renderAnalyticsContent()
      ) : !isInlineStatusView ? (
        <>
          {isCreatingTeam && canManageStandup ? (
            <section className="flex flex-wrap items-center gap-2 mb-3.5">
              <input
                aria-label={t('teams.newTeamName')}
                className="team-search-input min-w-[260px]"
                onChange={(event) => setNewTeamName(event.target.value)}
                placeholder={t('teams.enterTeamName')}
                type="text"
                value={newTeamName}
              />
              <button
                className="secondary-button"
                onClick={handleCreateTeam}
                type="button"
              >
                {t('teams.addTeam')}
              </button>
            </section>
          ) : null}

          <section className="mb-4">
            <label className="grid gap-1.5 text-[var(--text-main)] text-[13px] max-w-[280px]">
              <span>{t('dashboard.standupVerificationDate')}</span>
              <input
                aria-label={t('dashboard.standupVerificationDate')}
                className="date-input"
                onChange={handleSelectedDateChange}
                type="date"
                value={selectedDateKey}
              />
            </label>
          </section>

          <section className="mb-4">
            <input
              aria-label={t('common.search')}
              className="team-search-input"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                activeView === 'TEAMS'
                  ? t('dashboard.searchByTeamName')
                  : t('dashboard.searchByInternOrTeamName')
              }
              type="text"
              value={searchTerm}
            />
          </section>

          {activeView === 'TEAMS' ? (
            <TeamList
              addedInterns={addedInterns}
              onAddInternToTeam={
                canManageStandup ? handleAddInternToTeam : undefined
              }
              onDeleteIntern={canManageStandup ? handleDeleteIntern : undefined}
              onDeleteTeam={canManageStandup ? handleDeleteTeam : undefined}
              onUpdateIntern={canManageStandup ? handleUpdateIntern : undefined}
              onUpdateTeamName={
                canManageStandup ? handleUpdateTeamName : undefined
              }
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
                    ? t('dashboard.noCompletedInternsFound')
                    : t('dashboard.noInternsForCurrentSearch')}
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
        <section className="grid gap-3.5">
          {renderStatusPanelContent(false)}
        </section>
      )}

      {!isInlineStatusView && isStatusModalOpen ? (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-[80] flex justify-center bg-slate-900/45 p-[24px_14px]"
        >
          <section className="grid gap-3.5 max-h-full max-w-[980px] w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-xl overflow-y-auto p-4">
            {renderStatusPanelContent(true)}
          </section>
        </div>
      ) : null}

      {isRecordModalOpen && authToken ? (
        <RecordStandupModal
          authToken={authToken}
          onClose={() => setIsRecordModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      ) : null}
    </div>
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
function renderTeamHeatmap(
  teams: Team[],
  dateKeys: string[],
  teamTotals: Map<string, Map<string, number>>,
  noActivityLabel: string,
  scrollToViewMoreLabel: string,
  teamColumnLabel: string
): React.ReactElement {
  const rows = teams.filter((team) => normalizeTeamId(team.teamId));

  if (rows.length === 0 || dateKeys.length === 0) {
    return <div className="team-empty">{noActivityLabel}</div>;
  }

  return (
    <div className="team-heatmap-box">
      <div className="team-heatmap-scroll-hint">{scrollToViewMoreLabel}</div>
      <div className="team-heatmap-wrap">
        <div
          className="team-heatmap-grid"
          style={
            { '--heatmap-days': `${dateKeys.length}` } as React.CSSProperties
          }
        >
          <div className="team-heatmap-team-header">{teamColumnLabel}</div>
          {dateKeys.map((dateKey) => (
            <div className="team-heatmap-day-header" key={dateKey}>
              {formatWeekdayShort(dateKey)}
            </div>
          ))}

          {rows.map((team) => {
            const teamId = normalizeTeamId(team.teamId);
            const teamDateCounts = teamTotals.get(teamId) ?? new Map();

            return (
              <React.Fragment key={teamId}>
                <div className="team-heatmap-team-name" title={team.teamName}>
                  {team.teamName}
                </div>
                {dateKeys.map((dateKey) => {
                  const count = teamDateCounts.get(dateKey) ?? 0;
                  const intensity = getTeamHeatmapIntensity(count);

                  return (
                    <div
                      className="team-heatmap-cell"
                      key={`${teamId}-${dateKey}`}
                      title={`${team.teamName} | ${formatMonthDay(dateKey)}: ${count}/4 uploads`}
                      style={{
                        backgroundColor: intensity.background,
                        borderColor: intensity.border,
                      }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getTeamHeatmapIntensity(value: number): {
  background: string;
  border: string;
} {
  if (value <= 0) {
    return { background: '#EFF3FF', border: '#C6DBEF' };
  }

  if (value === 1) {
    return { background: '#C6DBEF', border: '#9ECAE1' };
  }

  if (value === 2) {
    return { background: '#9ECAE1', border: '#6BAED6' };
  }

  if (value === 3) {
    return { background: '#6BAED6', border: '#3182BD' };
  }

  return { background: '#3182BD', border: '#08519C' };
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
  audiosByInternByDate: Map<string, Map<string, InternAudioMetadata[]>>,
  pendingLabel: string
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
      slotStatuses,
      contributorDetails,
    };
  });
  const completedDaysCount = dayStatuses.filter(
    (status) => status.isCompleted
  ).length;
  const pendingDayDetails = dayStatuses
    .filter((status) => !status.isCompleted)
    .map(
      (status) =>
        `${status.dayLabel} (${status.remainingStandupCount} ${pendingLabel})`
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

function buildTeamAnalyticsQualityRow(
  team: Team,
  dateKeys: string[],
  audiosByInternByDate: Map<string, Map<string, InternAudioMetadata[]>>
): TeamAnalyticsQualityRow {
  let goodCount = 0;
  let delayedCount = 0;
  let missingCount = 0;

  for (const dateKey of dateKeys) {
    const slotStatuses = buildStandupSlotResults(
      collectTeamAudiosForDate(team, dateKey, audiosByInternByDate),
      dateKey
    );

    for (const slotStatus of slotStatuses) {
      if (slotStatus.status === 'GOOD') {
        goodCount += 1;
      } else if (slotStatus.status === 'DELAYED') {
        delayedCount += 1;
      } else {
        missingCount += 1;
      }
    }
  }

  return {
    teamId: team.teamId,
    teamName: team.teamName,
    goodCount,
    delayedCount,
    missingCount,
    score: goodCount * 2 + delayedCount,
  };
}

function rankAnalyticsQualityRows(
  rows: TeamAnalyticsQualityRow[],
  filter: AnalyticsQualityFilter
): TeamAnalyticsQualityRow[] {
  const filteredRows =
    filter === 'ALL'
      ? rows
      : rows.filter((row) => getAnalyticsQualityCount(row, filter) > 0);

  return [...filteredRows].sort((left, right) => {
    const primaryComparison =
      getAnalyticsQualityCount(right, filter) -
      getAnalyticsQualityCount(left, filter);

    if (primaryComparison !== 0) {
      return primaryComparison;
    }

    return (
      right.score - left.score ||
      right.goodCount - left.goodCount ||
      right.delayedCount - left.delayedCount ||
      left.missingCount - right.missingCount ||
      left.teamName.localeCompare(right.teamName)
    );
  });
}

function getAnalyticsQualityCount(
  row: TeamAnalyticsQualityRow,
  filter: AnalyticsQualityFilter
): number {
  if (filter === 'GOOD') {
    return row.goodCount;
  }

  if (filter === 'DELAYED') {
    return row.delayedCount;
  }

  if (filter === 'MISSING') {
    return row.missingCount;
  }

  return row.score;
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

function sumTeamStandupsForDate(
  team: Team,
  dateKey: string,
  countsByInternByDate: Map<string, Map<string, number>>
): number {
  return getTeamInternIds(team).reduce((total, internId) => {
    return total + (countsByInternByDate.get(internId)?.get(dateKey) ?? 0);
  }, 0);
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

function getTrailingDateKeys(
  anchorDateKey: string,
  daysBack: number
): string[] {
  const anchorDate = new Date(`${anchorDateKey}T00:00:00`);

  if (Number.isNaN(anchorDate.getTime())) {
    return [];
  }

  const dateKeys: string[] = [];

  for (let offset = daysBack; offset >= 0; offset -= 1) {
    const day = new Date(anchorDate);
    day.setDate(anchorDate.getDate() - offset);
    dateKeys.push(getLocalDateKey(day));
  }

  return dateKeys;
}

function formatWeekRangeLabel(
  weekDateKeys: string[],
  invalidWeekLabel: string
): string {
  if (weekDateKeys.length === 0) {
    return invalidWeekLabel;
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
  contributors: ContributorUploadDetail[],
  noUploadsLabel: string
): string {
  if (contributors.length === 0) {
    return noUploadsLabel;
  }

  return contributors
    .map(
      (contributor) => `${contributor.internName}: ${contributor.uploadCount}`
    )
    .join(' | ');
}

function getFilterButtonClass(isActive: boolean): string {
  return `glass border text-[13px] font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
    isActive
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm'
      : 'bg-white/10 dark:bg-black/10 border-white/10 dark:border-white/5 text-[var(--text-subtle)] hover:text-[var(--text-main)]'
  }`;
}

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

function getStatusSlotBackground(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return 'var(--slot-good-bg)';
  }

  if (status === 'DELAYED') {
    return 'var(--slot-delayed-bg)';
  }

  if (status === 'UPCOMING') {
    return 'var(--slot-upcoming-bg)';
  }

  return 'var(--slot-missing-bg)';
}

function getStatusSlotBorder(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return 'var(--slot-good-border)';
  }

  if (status === 'DELAYED') {
    return 'var(--slot-delayed-border)';
  }

  if (status === 'UPCOMING') {
    return 'var(--slot-upcoming-border)';
  }

  return 'var(--slot-missing-border)';
}

function getStatusSlotColor(status: StandupSlotResult['status']): string {
  if (status === 'GOOD') {
    return 'var(--slot-good-text)';
  }

  if (status === 'DELAYED') {
    return 'var(--slot-delayed-text)';
  }

  if (status === 'UPCOMING') {
    return 'var(--slot-upcoming-text)';
  }

  return 'var(--slot-missing-text)';
}

function getTeamMemberNames(team: Team): string[] {
  return team.interns
    .map((intern) =>
      (intern.internName || intern.corpusUserId || intern.internId || '').trim()
    )
    .filter((memberName) => memberName.length > 0);
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
