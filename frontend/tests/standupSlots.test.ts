import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import {
  buildStandupSlotResults,
  getDateKeyInTimeZone,
  getDefaultStandupTimeZone,
  resolveStandupSlot,
  resolveSlotForTimestamp,
} from '../src/utils/verification/standupSlots.ts';

describe('standupSlots', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('treats an upload just before the on-time deadline as good', () => {
    expect(
      resolveSlotForTimestamp(
        '2026-02-10T03:59:59.000Z',
        '2026-02-10',
        getDefaultStandupTimeZone()
      )
    ).toEqual({
      slot: {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        startMinutes: 540,
        endMinutes: 570,
        lateCutoffMinutes: 720,
      },
      status: 'GOOD',
    });
  });

  test('treats an upload exactly on the on-time deadline as delayed', () => {
    expect(
      resolveSlotForTimestamp(
        '2026-02-10T04:00:00.000Z',
        '2026-02-10',
        getDefaultStandupTimeZone()
      )
    ).toEqual({
      slot: {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        startMinutes: 540,
        endMinutes: 570,
        lateCutoffMinutes: 720,
      },
      status: 'DELAYED',
    });
  });

  test('returns missing statuses when there are no uploads for the day', () => {
    const slots = buildStandupSlotResults([], '2026-02-10');

    expect(slots.every((slot) => slot.status === 'MISSING')).toBe(true);
  });

  test('marks 09:10 IST as S1 GOOD', () => {
    const slots = buildStandupSlotResults(
      [{ id: 's1-good', uploadedAt: '2026-02-10T03:40:00.000Z' }],
      '2026-02-10'
    );

    expect(slots[0]).toEqual({
      slotId: 'S1',
      label: 'Standup 1',
      windowLabel: '09:00-09:30',
      status: 'GOOD',
      uploadedAt: '2026-02-10T03:40:00.000Z',
      audioId: 's1-good',
    });
  });

  test('treats timezone-less GMT timestamps as UTC when resolving slots', () => {
    const slots = buildStandupSlotResults(
      [{ id: 's1-gmt', uploadedAt: '2026-02-10T03:40:00' }],
      '2026-02-10'
    );

    expect(slots[0]).toEqual({
      slotId: 'S1',
      label: 'Standup 1',
      windowLabel: '09:00-09:30',
      status: 'GOOD',
      uploadedAt: '2026-02-10T03:40:00',
      audioId: 's1-gmt',
    });
  });

  test('treats 10:00 IST as S1 DELAYED after the slot window ends', () => {
    const slots = buildStandupSlotResults(
      [{ id: 's1-late', uploadedAt: '2026-02-10T04:30:00.000Z' }],
      '2026-02-10'
    );

    expect(slots[0]).toEqual({
      slotId: 'S1',
      label: 'Standup 1',
      windowLabel: '09:00-09:30',
      status: 'DELAYED',
      uploadedAt: '2026-02-10T04:30:00.000Z',
      audioId: 's1-late',
    });
  });

  test('marks 12:10 IST as S2 GOOD', () => {
    const slots = buildStandupSlotResults(
      [{ id: 's2-good', uploadedAt: '2026-02-10T06:40:00.000Z' }],
      '2026-02-10'
    );

    expect(slots[1]).toEqual({
      slotId: 'S2',
      label: 'Standup 2',
      windowLabel: '12:00-12:30',
      status: 'GOOD',
      uploadedAt: '2026-02-10T06:40:00.000Z',
      audioId: 's2-good',
    });
  });

  test('keeps a single standup 2 upload as standup 2 good and standup 1 missing', () => {
    const slots = buildStandupSlotResults(
      [{ id: 's2-only', uploadedAt: '2026-02-10T06:35:00.000Z' }],
      '2026-02-10'
    );

    expect(slots).toEqual([
      {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        status: 'MISSING',
      },
      {
        slotId: 'S2',
        label: 'Standup 2',
        windowLabel: '12:00-12:30',
        status: 'GOOD',
        uploadedAt: '2026-02-10T06:35:00.000Z',
        audioId: 's2-only',
      },
      {
        slotId: 'S3',
        label: 'Standup 3',
        windowLabel: '14:00-14:30',
        status: 'MISSING',
      },
      {
        slotId: 'S4',
        label: 'Standup 4',
        windowLabel: '16:30-17:00',
        status: 'MISSING',
      },
    ]);
  });

  test('sorts invalid timestamps last and ignores them safely', () => {
    const slots = buildStandupSlotResults(
      [
        { id: 'invalid', uploadedAt: 'not-a-date' },
        { id: 'valid', uploadedAt: '2026-02-10T03:40:00.000Z' },
      ],
      '2026-02-10'
    );

    expect(slots[0]).toEqual({
      slotId: 'S1',
      label: 'Standup 1',
      windowLabel: '09:00-09:30',
      status: 'GOOD',
      uploadedAt: '2026-02-10T03:40:00.000Z',
      audioId: 'valid',
    });
  });

  test('handles missing uploadedAt values without crashing', () => {
    const slots = buildStandupSlotResults(
      [
        { id: 'missing-timestamp' },
        { id: 'valid', uploadedAt: '2026-02-10T03:40:00.000Z' },
      ],
      '2026-02-10'
    );

    expect(slots[0].audioId).toBe('valid');
    expect(slots[0].status).toBe('GOOD');
  });

  test('backfills an earlier missing slot as delayed when multiple uploads land in standup 2', () => {
    const slots = buildStandupSlotResults(
      [
        { id: 's2-current', uploadedAt: '2026-02-10T06:35:00.000Z' },
        { id: 's1-backfill', uploadedAt: '2026-02-10T06:55:00.000Z' },
      ],
      '2026-02-10'
    );

    expect(slots).toEqual([
      {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        status: 'DELAYED',
        uploadedAt: '2026-02-10T06:55:00.000Z',
        audioId: 's1-backfill',
      },
      {
        slotId: 'S2',
        label: 'Standup 2',
        windowLabel: '12:00-12:30',
        status: 'GOOD',
        uploadedAt: '2026-02-10T06:35:00.000Z',
        audioId: 's2-current',
      },
      {
        slotId: 'S3',
        label: 'Standup 3',
        windowLabel: '14:00-14:30',
        status: 'MISSING',
      },
      {
        slotId: 'S4',
        label: 'Standup 4',
        windowLabel: '16:30-17:00',
        status: 'MISSING',
      },
    ]);
  });

  test('backfills the most recent earlier missing slot first', () => {
    const slots = buildStandupSlotResults(
      [
        { id: 's3-current', uploadedAt: '2026-02-10T08:35:00.000Z' },
        { id: 's2-backfill', uploadedAt: '2026-02-10T08:55:00.000Z' },
      ],
      '2026-02-10'
    );

    expect(slots).toEqual([
      {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        status: 'MISSING',
      },
      {
        slotId: 'S2',
        label: 'Standup 2',
        windowLabel: '12:00-12:30',
        status: 'DELAYED',
        uploadedAt: '2026-02-10T08:55:00.000Z',
        audioId: 's2-backfill',
      },
      {
        slotId: 'S3',
        label: 'Standup 3',
        windowLabel: '14:00-14:30',
        status: 'GOOD',
        uploadedAt: '2026-02-10T08:35:00.000Z',
        audioId: 's3-current',
      },
      {
        slotId: 'S4',
        label: 'Standup 4',
        windowLabel: '16:30-17:00',
        status: 'MISSING',
      },
    ]);
  });

  test('marks the current slot as delayed after its window closes', () => {
    const slots = buildStandupSlotResults(
      [{ id: 's2-late', uploadedAt: '2026-02-10T07:45:00.000Z' }],
      '2026-02-10'
    );

    expect(slots).toEqual([
      {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        status: 'MISSING',
      },
      {
        slotId: 'S2',
        label: 'Standup 2',
        windowLabel: '12:00-12:30',
        status: 'DELAYED',
        uploadedAt: '2026-02-10T07:45:00.000Z',
        audioId: 's2-late',
      },
      {
        slotId: 'S3',
        label: 'Standup 3',
        windowLabel: '14:00-14:30',
        status: 'MISSING',
      },
      {
        slotId: 'S4',
        label: 'Standup 4',
        windowLabel: '16:30-17:00',
        status: 'MISSING',
      },
    ]);
  });

  test('ignores uploads outside the selected day in IST', () => {
    const slots = buildStandupSlotResults(
      [{ id: 'other-day', uploadedAt: '2026-02-10T18:45:00.000Z' }],
      '2026-02-10'
    );

    expect(slots.every((slot) => slot.status === 'MISSING')).toBe(true);
  });

  test('converts UTC corpus timestamps to IST date keys', () => {
    expect(
      getDateKeyInTimeZone(
        '2026-02-09T18:45:00.000Z',
        getDefaultStandupTimeZone()
      )
    ).toBe('2026-02-10');
  });

  test('returns undefined for invalid dates when resolving date key', () => {
    expect(getDateKeyInTimeZone('invalid-date')).toBeUndefined();
  });

  test('returns undefined when timestamp is missing or invalid', () => {
    expect(resolveSlotForTimestamp(undefined, '2026-02-10')).toBeUndefined();
    expect(
      resolveSlotForTimestamp('invalid-date', '2026-02-10')
    ).toBeUndefined();
  });

  test('returns undefined when all slots are already filled', () => {
    expect(
      resolveSlotForTimestamp(
        '2026-02-10T03:40:00.000Z',
        '2026-02-10',
        getDefaultStandupTimeZone(),
        new Set(['S1', 'S2', 'S3', 'S4'])
      )
    ).toBeUndefined();
  });

  test('returns undefined when no slot remains before cutoff', () => {
    expect(resolveStandupSlot(24 * 60 * 60)).toBeUndefined();
  });

  test('returns undefined before the first slot window', () => {
    expect(resolveStandupSlot(0)).toBeUndefined();
  });

  test('skips filled earlier slots until it finds the next missing backfill target', () => {
    expect(
      resolveStandupSlot(14 * 60 * 60 + 35 * 60, new Set(['S2', 'S3']))
    )?.toMatchObject({
      slotId: 'S1',
      label: 'Standup 1',
    });
  });

  test('defaults missing seconds to zero when reading zoned date parts', () => {
    const partsWithoutSeconds: Intl.DateTimeFormatPart[] = [
      { type: 'year', value: '2026' },
      { type: 'month', value: '02' },
      { type: 'day', value: '10' },
      { type: 'hour', value: '09' },
      { type: 'minute', value: '10' },
    ];

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      function MockDateTimeFormat() {
        return {
          formatToParts: () => partsWithoutSeconds,
        } as Intl.DateTimeFormat;
      } as unknown as typeof Intl.DateTimeFormat
    );

    expect(getDateKeyInTimeZone('2026-02-10T03:40:00.000Z')).toBe('2026-02-10');
    expect(
      resolveSlotForTimestamp('2026-02-10T03:40:00.000Z', '2026-02-10')
    ).toEqual({
      slot: {
        slotId: 'S1',
        label: 'Standup 1',
        windowLabel: '09:00-09:30',
        startMinutes: 540,
        endMinutes: 570,
        lateCutoffMinutes: 720,
      },
      status: 'GOOD',
    });
  });

  test('returns undefined when Intl cannot provide complete zoned date parts', () => {
    const incompleteParts: Intl.DateTimeFormatPart[] = [
      { type: 'year', value: '2026' },
      { type: 'month', value: '02' },
      { type: 'day', value: '10' },
      { type: 'hour', value: '09' },
      { type: 'second', value: '00' },
    ];

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      function MockDateTimeFormat() {
        return {
          formatToParts: () => incompleteParts,
        } as Intl.DateTimeFormat;
      } as unknown as typeof Intl.DateTimeFormat
    );

    expect(getDateKeyInTimeZone('2026-02-10T03:40:00.000Z')).toBeUndefined();
    expect(
      resolveSlotForTimestamp('2026-02-10T03:40:00.000Z', '2026-02-10')
    ).toBeUndefined();
  });
});
