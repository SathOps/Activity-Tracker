import type { StandupSlotResult } from '../../utils/verification';

export type StatusAnalyticsFilter = 'ALL' | 'COMPLETED' | 'PENDING';
export type QualityAnalyticsFilter = 'ALL' | 'GOOD' | 'DELAYED' | 'MISSING';

export interface DailyAnalyticsRow {
  teamId: string;
  teamName: string;
  standupCount: number;
  requiredStandupCount: number;
  remainingStandupCount: number;
  isCompleted: boolean;
}

export interface WeeklyAnalyticsRow {
  teamId: string;
  teamName: string;
  completedDaysCount: number;
  totalDaysCount: number;
  totalRemainingStandups: number;
  hasPendingDays: boolean;
}

export interface AnalyticsMetric {
  label: string;
  value: string;
  helperText: string;
  tone: 'neutral' | 'good' | 'warn';
}

export interface LeaderboardMetricSummary {
  goodCount: number;
  delayedCount: number;
  missingCount: number;
  matchedQualityCount: number;
}

export interface DailyLeaderboardRow extends LeaderboardMetricSummary {
  teamId: string;
  teamName: string;
  score: number;
  isCompleted: boolean;
}

export interface WeeklyLeaderboardRow extends LeaderboardMetricSummary {
  teamId: string;
  teamName: string;
  score: number;
  completedDaysCount: number;
  totalDaysCount: number;
  hasPendingDays: boolean;
  goodDaysCount: number;
  delayedDaysCount: number;
  missingDaysCount: number;
}

export function filterDailyAnalyticsRows<T extends DailyAnalyticsRow>(
  rows: T[],
  filter: StatusAnalyticsFilter
): T[] {
  if (filter === 'COMPLETED') {
    return rows.filter((row) => row.isCompleted);
  }

  if (filter === 'PENDING') {
    return rows.filter((row) => !row.isCompleted);
  }

  return rows;
}

export function filterWeeklyAnalyticsRows<T extends WeeklyAnalyticsRow>(
  rows: T[],
  filter: StatusAnalyticsFilter
): T[] {
  if (filter === 'COMPLETED') {
    return rows.filter((row) => !row.hasPendingDays);
  }

  if (filter === 'PENDING') {
    return rows.filter((row) => row.hasPendingDays);
  }

  return rows;
}

export function buildDailyLeaderboardRows<
  T extends {
    teamId: string;
    teamName: string;
    isCompleted: boolean;
    slotStatuses: StandupSlotResult[];
  },
>(rows: T[]): DailyLeaderboardRow[] {
  return rows
    .map((row) => {
      const summary = summarizeSlotStatuses(row.slotStatuses);

      return {
        teamId: row.teamId,
        teamName: row.teamName,
        score: buildLeaderboardScore(summary.goodCount, summary.delayedCount),
        isCompleted: row.isCompleted,
        ...summary,
      };
    })
    .sort(compareDailyLeaderboardRows);
}

export function buildWeeklyLeaderboardRows<
  T extends {
    teamId: string;
    teamName: string;
    completedDaysCount: number;
    dayStatuses: Array<{
      isCompleted: boolean;
      slotStatuses: StandupSlotResult[];
    }>;
  },
>(rows: T[]): WeeklyLeaderboardRow[] {
  return rows
    .map((row) => {
      const totalDaysCount = row.dayStatuses.length;
      const weeklySummary = row.dayStatuses.reduce<WeeklyLeaderboardRow>(
        (summary, dayStatus) => {
          const daySummary = summarizeSlotStatuses(dayStatus.slotStatuses);

          return {
            ...summary,
            goodCount: summary.goodCount + daySummary.goodCount,
            delayedCount: summary.delayedCount + daySummary.delayedCount,
            missingCount: summary.missingCount + daySummary.missingCount,
            matchedQualityCount:
              summary.matchedQualityCount + daySummary.matchedQualityCount,
            goodDaysCount:
              summary.goodDaysCount + (daySummary.goodCount > 0 ? 1 : 0),
            delayedDaysCount:
              summary.delayedDaysCount + (daySummary.delayedCount > 0 ? 1 : 0),
            missingDaysCount:
              summary.missingDaysCount + (daySummary.missingCount > 0 ? 1 : 0),
          };
        },
        {
          teamId: row.teamId,
          teamName: row.teamName,
          score: 0,
          completedDaysCount: row.completedDaysCount,
          totalDaysCount,
          hasPendingDays: row.completedDaysCount < totalDaysCount,
          goodCount: 0,
          delayedCount: 0,
          missingCount: 0,
          matchedQualityCount: 0,
          goodDaysCount: 0,
          delayedDaysCount: 0,
          missingDaysCount: 0,
        }
      );

      return {
        ...weeklySummary,
        score: buildLeaderboardScore(
          weeklySummary.goodCount,
          weeklySummary.delayedCount
        ),
      };
    })
    .sort(compareWeeklyLeaderboardRows);
}

export function filterDailyLeaderboardRows<T extends DailyLeaderboardRow>(
  rows: T[],
  qualityFilter: QualityAnalyticsFilter,
  statusFilter: StatusAnalyticsFilter
): T[] {
  return rows.filter((row) => {
    if (!matchesStatusFilter(row.isCompleted, statusFilter)) {
      return false;
    }

    return matchesQualityFilter(row, qualityFilter);
  });
}

export function filterWeeklyLeaderboardRows<T extends WeeklyLeaderboardRow>(
  rows: T[],
  qualityFilter: QualityAnalyticsFilter,
  statusFilter: StatusAnalyticsFilter
): T[] {
  return rows.filter((row) => {
    if (!matchesStatusFilter(!row.hasPendingDays, statusFilter)) {
      return false;
    }

    return matchesQualityFilter(row, qualityFilter);
  });
}

export function buildDailyAnalyticsMetrics(
  rows: DailyAnalyticsRow[]
): AnalyticsMetric[] {
  const totalTeams = rows.length;
  const completedTeams = rows.filter((row) => row.isCompleted).length;
  const pendingTeams = totalTeams - completedTeams;
  const uploadedStandups = rows.reduce(
    (total, row) => total + row.standupCount,
    0
  );
  const requiredStandups = rows.reduce(
    (total, row) => total + row.requiredStandupCount,
    0
  );
  const remainingStandups = rows.reduce(
    (total, row) => total + row.remainingStandupCount,
    0
  );

  return [
    {
      label: 'Teams In View',
      value: String(totalTeams),
      helperText: 'Teams after current filter',
      tone: 'neutral',
    },
    {
      label: 'Completed Teams',
      value: String(completedTeams),
      helperText: "Teams that met today's target",
      tone: 'good',
    },
    {
      label: 'Pending Teams',
      value: String(pendingTeams),
      helperText: 'Teams still below daily target',
      tone: pendingTeams > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Standups Logged',
      value: `${uploadedStandups}/${requiredStandups}`,
      helperText: `${remainingStandups} standup(s) still pending`,
      tone: remainingStandups > 0 ? 'warn' : 'good',
    },
  ];
}

export function buildWeeklyAnalyticsMetrics(
  rows: WeeklyAnalyticsRow[]
): AnalyticsMetric[] {
  const totalTeams = rows.length;
  const completedTeams = rows.filter((row) => !row.hasPendingDays).length;
  const pendingTeams = totalTeams - completedTeams;
  const totalRemainingStandups = rows.reduce(
    (total, row) => total + row.totalRemainingStandups,
    0
  );
  const averageCompletedDays =
    totalTeams === 0
      ? 0
      : rows.reduce((total, row) => total + row.completedDaysCount, 0) /
        totalTeams;

  return [
    {
      label: 'Teams In View',
      value: String(totalTeams),
      helperText: 'Teams after current filter',
      tone: 'neutral',
    },
    {
      label: 'Weekly Complete',
      value: String(completedTeams),
      helperText: 'Teams with no pending days',
      tone: 'good',
    },
    {
      label: 'Needs Follow-up',
      value: String(pendingTeams),
      helperText: 'Teams with pending weekly days',
      tone: pendingTeams > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Avg Completed Days',
      value: averageCompletedDays.toFixed(1),
      helperText: `${totalRemainingStandups} standup(s) still pending this week`,
      tone: totalRemainingStandups > 0 ? 'warn' : 'good',
    },
  ];
}

export function buildLeaderboardMetrics<T extends LeaderboardMetricSummary>(
  rows: T[],
  qualityFilter: QualityAnalyticsFilter
): AnalyticsMetric[] {
  const teamsInView = rows.length;
  const goodCount = rows.reduce((total, row) => total + row.goodCount, 0);
  const delayedCount = rows.reduce((total, row) => total + row.delayedCount, 0);
  const missingCount = rows.reduce((total, row) => total + row.missingCount, 0);
  const matchedQualityCount = rows.reduce(
    (total, row) =>
      total +
      (qualityFilter === 'ALL'
        ? row.matchedQualityCount
        : getCountForQuality(row, qualityFilter)),
    0
  );

  return [
    {
      label: 'Teams In View',
      value: String(teamsInView),
      helperText: 'Teams after current filters',
      tone: 'neutral',
    },
    {
      label: 'Good Slots',
      value: String(goodCount),
      helperText: 'On-time standup uploads',
      tone: goodCount > 0 ? 'good' : 'neutral',
    },
    {
      label: 'Delayed Slots',
      value: String(delayedCount),
      helperText: 'Late but accepted uploads',
      tone: delayedCount > 0 ? 'warn' : 'neutral',
    },
    {
      label: qualityFilter === 'ALL' ? 'Missing Slots' : 'Matched Slots',
      value: String(
        qualityFilter === 'ALL' ? missingCount : matchedQualityCount
      ),
      helperText:
        qualityFilter === 'ALL'
          ? 'Slots still missing uploads'
          : `${qualityFilter.toLowerCase()} slot(s) in the current view`,
      tone:
        qualityFilter === 'MISSING' ||
        (qualityFilter === 'ALL' && missingCount > 0)
          ? 'warn'
          : 'neutral',
    },
  ];
}

function summarizeSlotStatuses(
  slotStatuses: StandupSlotResult[]
): LeaderboardMetricSummary {
  const summary = {
    goodCount: 0,
    delayedCount: 0,
    missingCount: 0,
    matchedQualityCount: 0,
  };

  for (const slot of slotStatuses) {
    if (slot.status === 'GOOD') {
      summary.goodCount += 1;
    } else if (slot.status === 'DELAYED') {
      summary.delayedCount += 1;
    } else {
      summary.missingCount += 1;
    }

    summary.matchedQualityCount += 1;
  }

  return summary;
}

function buildLeaderboardScore(
  goodCount: number,
  delayedCount: number
): number {
  return goodCount * 2 + delayedCount;
}

function compareDailyLeaderboardRows(
  left: DailyLeaderboardRow,
  right: DailyLeaderboardRow
): number {
  return compareLeaderboardFields(left, right);
}

function compareWeeklyLeaderboardRows(
  left: WeeklyLeaderboardRow,
  right: WeeklyLeaderboardRow
): number {
  const fieldComparison = compareLeaderboardFields(left, right);
  const completedDaysComparison =
    right.completedDaysCount - left.completedDaysCount;
  const pendingDaysComparison =
    Number(left.hasPendingDays) - Number(right.hasPendingDays);

  return (
    fieldComparison || completedDaysComparison || pendingDaysComparison || 0
  );
}

function compareLeaderboardFields(
  left: LeaderboardMetricSummary & { teamName: string; score: number },
  right: LeaderboardMetricSummary & { teamName: string; score: number }
): number {
  return (
    right.score - left.score ||
    right.goodCount - left.goodCount ||
    left.missingCount - right.missingCount ||
    left.delayedCount - right.delayedCount ||
    left.teamName.localeCompare(right.teamName)
  );
}

function matchesQualityFilter(
  row: LeaderboardMetricSummary,
  qualityFilter: QualityAnalyticsFilter
): boolean {
  if (qualityFilter === 'ALL') {
    return true;
  }

  return getCountForQuality(row, qualityFilter) > 0;
}

function getCountForQuality(
  row: LeaderboardMetricSummary,
  qualityFilter: Exclude<QualityAnalyticsFilter, 'ALL'>
): number {
  if (qualityFilter === 'GOOD') {
    return row.goodCount;
  }

  if (qualityFilter === 'DELAYED') {
    return row.delayedCount;
  }

  return row.missingCount;
}

function matchesStatusFilter(
  isCompleted: boolean,
  statusFilter: StatusAnalyticsFilter
): boolean {
  if (statusFilter === 'ALL') {
    return true;
  }

  return statusFilter === 'COMPLETED' ? isCompleted : !isCompleted;
}
