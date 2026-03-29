export type StatusAnalyticsFilter = 'ALL' | 'COMPLETED' | 'PENDING';

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
