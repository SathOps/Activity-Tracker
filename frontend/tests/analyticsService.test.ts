import { describe, expect, test } from 'vite-plus/test';

import {
  buildDailyLeaderboardRows,
  buildDailyAnalyticsMetrics,
  buildLeaderboardMetrics,
  buildWeeklyLeaderboardRows,
  filterDailyLeaderboardRows,
  buildWeeklyAnalyticsMetrics,
  filterDailyAnalyticsRows,
  filterWeeklyLeaderboardRows,
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

  test('builds and ranks daily leaderboard rows by score and tie breakers', () => {
    const rows = buildDailyLeaderboardRows([
      {
        teamId: 'beta',
        teamName: 'Beta',
        isCompleted: false,
        slotStatuses: [
          {
            slotId: 'S1',
            label: 'S1',
            windowLabel: '09:00-09:30',
            status: 'GOOD',
          },
          {
            slotId: 'S2',
            label: 'S2',
            windowLabel: '12:00-12:30',
            status: 'DELAYED',
          },
          {
            slotId: 'S3',
            label: 'S3',
            windowLabel: '14:00-14:30',
            status: 'MISSING',
          },
          {
            slotId: 'S4',
            label: 'S4',
            windowLabel: '16:30-17:00',
            status: 'MISSING',
          },
        ],
      },
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        isCompleted: true,
        slotStatuses: [
          {
            slotId: 'S1',
            label: 'S1',
            windowLabel: '09:00-09:30',
            status: 'GOOD',
          },
          {
            slotId: 'S2',
            label: 'S2',
            windowLabel: '12:00-12:30',
            status: 'GOOD',
          },
          {
            slotId: 'S3',
            label: 'S3',
            windowLabel: '14:00-14:30',
            status: 'DELAYED',
          },
          {
            slotId: 'S4',
            label: 'S4',
            windowLabel: '16:30-17:00',
            status: 'MISSING',
          },
        ],
      },
    ]);

    expect(rows).toEqual([
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        score: 5,
        isCompleted: true,
        goodCount: 2,
        delayedCount: 1,
        missingCount: 1,
        matchedQualityCount: 4,
      },
      {
        teamId: 'beta',
        teamName: 'Beta',
        score: 3,
        isCompleted: false,
        goodCount: 1,
        delayedCount: 1,
        missingCount: 2,
        matchedQualityCount: 4,
      },
    ]);
  });

  test('filters daily leaderboard rows by quality and status', () => {
    const rows = [
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        score: 8,
        isCompleted: true,
        goodCount: 4,
        delayedCount: 0,
        missingCount: 0,
        matchedQualityCount: 4,
      },
      {
        teamId: 'beta',
        teamName: 'Beta',
        score: 2,
        isCompleted: false,
        goodCount: 0,
        delayedCount: 2,
        missingCount: 2,
        matchedQualityCount: 4,
      },
    ];

    expect(filterDailyLeaderboardRows(rows, 'GOOD', 'ALL')).toEqual([rows[0]]);
    expect(filterDailyLeaderboardRows(rows, 'DELAYED', 'PENDING')).toEqual([
      rows[1],
    ]);
    expect(filterDailyLeaderboardRows(rows, 'MISSING', 'COMPLETED')).toEqual(
      []
    );
  });

  test('builds weekly leaderboard rows with slot and day totals', () => {
    const rows = buildWeeklyLeaderboardRows([
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        completedDaysCount: 1,
        dayStatuses: [
          {
            isCompleted: true,
            slotStatuses: [
              {
                slotId: 'S1',
                label: 'S1',
                windowLabel: '09:00-09:30',
                status: 'GOOD',
              },
              {
                slotId: 'S2',
                label: 'S2',
                windowLabel: '12:00-12:30',
                status: 'GOOD',
              },
              {
                slotId: 'S3',
                label: 'S3',
                windowLabel: '14:00-14:30',
                status: 'GOOD',
              },
              {
                slotId: 'S4',
                label: 'S4',
                windowLabel: '16:30-17:00',
                status: 'GOOD',
              },
            ],
          },
          {
            isCompleted: false,
            slotStatuses: [
              {
                slotId: 'S1',
                label: 'S1',
                windowLabel: '09:00-09:30',
                status: 'DELAYED',
              },
              {
                slotId: 'S2',
                label: 'S2',
                windowLabel: '12:00-12:30',
                status: 'MISSING',
              },
              {
                slotId: 'S3',
                label: 'S3',
                windowLabel: '14:00-14:30',
                status: 'MISSING',
              },
              {
                slotId: 'S4',
                label: 'S4',
                windowLabel: '16:30-17:00',
                status: 'MISSING',
              },
            ],
          },
        ],
      },
    ]);

    expect(rows).toEqual([
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        score: 9,
        completedDaysCount: 1,
        totalDaysCount: 2,
        hasPendingDays: true,
        goodCount: 4,
        delayedCount: 1,
        missingCount: 3,
        matchedQualityCount: 8,
        goodDaysCount: 1,
        delayedDaysCount: 1,
        missingDaysCount: 1,
      },
    ]);
  });

  test('filters weekly leaderboard rows and builds summary metrics', () => {
    const rows = [
      {
        teamId: 'alpha',
        teamName: 'Alpha',
        score: 10,
        completedDaysCount: 5,
        totalDaysCount: 5,
        hasPendingDays: false,
        goodCount: 8,
        delayedCount: 2,
        missingCount: 0,
        matchedQualityCount: 10,
        goodDaysCount: 5,
        delayedDaysCount: 2,
        missingDaysCount: 0,
      },
      {
        teamId: 'beta',
        teamName: 'Beta',
        score: 2,
        completedDaysCount: 1,
        totalDaysCount: 5,
        hasPendingDays: true,
        goodCount: 0,
        delayedCount: 2,
        missingCount: 18,
        matchedQualityCount: 20,
        goodDaysCount: 0,
        delayedDaysCount: 2,
        missingDaysCount: 5,
      },
    ];

    expect(filterWeeklyLeaderboardRows(rows, 'MISSING', 'PENDING')).toEqual([
      rows[1],
    ]);
    expect(buildLeaderboardMetrics([rows[1]], 'MISSING')).toEqual([
      {
        label: 'Teams In View',
        value: '1',
        helperText: 'Teams after current filters',
        tone: 'neutral',
      },
      {
        label: 'Good Slots',
        value: '0',
        helperText: 'On-time standup uploads',
        tone: 'neutral',
      },
      {
        label: 'Delayed Slots',
        value: '2',
        helperText: 'Late but accepted uploads',
        tone: 'warn',
      },
      {
        label: 'Matched Slots',
        value: '18',
        helperText: 'missing slot(s) in the current view',
        tone: 'warn',
      },
    ]);
  });
});
