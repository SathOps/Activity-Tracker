import { describe, expect, test } from 'vite-plus/test';

import {
  buildDailyAnalyticsMetrics,
  buildWeeklyAnalyticsMetrics,
  filterDailyAnalyticsRows,
  filterWeeklyAnalyticsRows,
} from '../src/services/analytics/index.ts';

describe('analyticsService', () => {
  test('filters daily analytics rows by completion state', () => {
    const rows = [
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        standupCount: 4,
        requiredStandupCount: 4,
        remainingStandupCount: 0,
        isCompleted: true,
      },
      {
        teamId: 'beta',
        teamName: 'Beta',
        standupCount: 1,
        requiredStandupCount: 4,
        remainingStandupCount: 3,
        isCompleted: false,
      },
    ];

    expect(filterDailyAnalyticsRows(rows, 'COMPLETED')).toHaveLength(1);
    expect(filterDailyAnalyticsRows(rows, 'PENDING')).toHaveLength(1);
    expect(filterDailyAnalyticsRows(rows, 'ALL')).toHaveLength(2);
  });

  test('builds daily analytics metrics from filtered rows', () => {
    const metrics = buildDailyAnalyticsMetrics([
      {
        teamId: 'beta',
        teamName: 'Beta',
        standupCount: 1,
        requiredStandupCount: 4,
        remainingStandupCount: 3,
        isCompleted: false,
      },
    ]);

    expect(metrics).toEqual([
      {
        label: 'Teams In View',
        value: '1',
        helperText: 'Teams after current filter',
        tone: 'neutral',
      },
      {
        label: 'Completed Teams',
        value: '0',
        helperText: "Teams that met today's target",
        tone: 'good',
      },
      {
        label: 'Pending Teams',
        value: '1',
        helperText: 'Teams still below daily target',
        tone: 'warn',
      },
      {
        label: 'Standups Logged',
        value: '1/4',
        helperText: '3 standup(s) still pending',
        tone: 'warn',
      },
    ]);
  });

  test('builds daily analytics metrics when all teams are complete', () => {
    const metrics = buildDailyAnalyticsMetrics([
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        standupCount: 4,
        requiredStandupCount: 4,
        remainingStandupCount: 0,
        isCompleted: true,
      },
    ]);

    expect(metrics[2]).toEqual({
      label: 'Pending Teams',
      value: '0',
      helperText: 'Teams still below daily target',
      tone: 'neutral',
    });
    expect(metrics[3]).toEqual({
      label: 'Standups Logged',
      value: '4/4',
      helperText: '0 standup(s) still pending',
      tone: 'good',
    });
  });

  test('filters weekly analytics rows and computes weekly metrics', () => {
    const weeklyRows = [
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        completedDaysCount: 7,
        totalDaysCount: 7,
        totalRemainingStandups: 0,
        hasPendingDays: false,
      },
      {
        teamId: 'beta',
        teamName: 'Beta',
        completedDaysCount: 2,
        totalDaysCount: 7,
        totalRemainingStandups: 10,
        hasPendingDays: true,
      },
    ];

    expect(filterWeeklyAnalyticsRows(weeklyRows, 'COMPLETED')).toHaveLength(1);
    expect(filterWeeklyAnalyticsRows(weeklyRows, 'PENDING')).toHaveLength(1);
    expect(filterWeeklyAnalyticsRows(weeklyRows, 'ALL')).toHaveLength(2);

    expect(
      buildWeeklyAnalyticsMetrics(
        filterWeeklyAnalyticsRows(weeklyRows, 'PENDING')
      )
    ).toEqual([
      {
        label: 'Teams In View',
        value: '1',
        helperText: 'Teams after current filter',
        tone: 'neutral',
      },
      {
        label: 'Weekly Complete',
        value: '0',
        helperText: 'Teams with no pending days',
        tone: 'good',
      },
      {
        label: 'Needs Follow-up',
        value: '1',
        helperText: 'Teams with pending weekly days',
        tone: 'warn',
      },
      {
        label: 'Avg Completed Days',
        value: '2.0',
        helperText: '10 standup(s) still pending this week',
        tone: 'warn',
      },
    ]);
  });

  test('builds weekly metrics for fully completed and empty views', () => {
    const completedRows = [
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        completedDaysCount: 7,
        totalDaysCount: 7,
        totalRemainingStandups: 0,
        hasPendingDays: false,
      },
    ];

    expect(buildWeeklyAnalyticsMetrics(completedRows)).toEqual([
      {
        label: 'Teams In View',
        value: '1',
        helperText: 'Teams after current filter',
        tone: 'neutral',
      },
      {
        label: 'Weekly Complete',
        value: '1',
        helperText: 'Teams with no pending days',
        tone: 'good',
      },
      {
        label: 'Needs Follow-up',
        value: '0',
        helperText: 'Teams with pending weekly days',
        tone: 'neutral',
      },
      {
        label: 'Avg Completed Days',
        value: '7.0',
        helperText: '0 standup(s) still pending this week',
        tone: 'good',
      },
    ]);

    expect(buildWeeklyAnalyticsMetrics([])).toEqual([
      {
        label: 'Teams In View',
        value: '0',
        helperText: 'Teams after current filter',
        tone: 'neutral',
      },
      {
        label: 'Weekly Complete',
        value: '0',
        helperText: 'Teams with no pending days',
        tone: 'good',
      },
      {
        label: 'Needs Follow-up',
        value: '0',
        helperText: 'Teams with pending weekly days',
        tone: 'neutral',
      },
      {
        label: 'Avg Completed Days',
        value: '0.0',
        helperText: '0 standup(s) still pending this week',
        tone: 'good',
      },
    ]);
  });
});
