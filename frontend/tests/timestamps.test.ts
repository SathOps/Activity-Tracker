import { describe, expect, test } from 'vitest';

import { parseTimestamp, toIsoTimestamp } from '../src/utils/timestamps.ts';

describe('timestamps', () => {
  test('returns undefined for invalid Date instances', () => {
    expect(parseTimestamp(new Date('invalid-date'))).toBeUndefined();
  });

  test('returns undefined for blank timestamp strings', () => {
    expect(parseTimestamp('   ')).toBeUndefined();
    expect(toIsoTimestamp('')).toBeUndefined();
  });

  test('parses numeric timestamp strings as Unix timestamps', () => {
    expect(parseTimestamp('1706788800')?.toISOString()).toBe(
      '2024-02-01T12:00:00.000Z'
    );
    expect(parseTimestamp('1706788800000')?.toISOString()).toBe(
      '2024-02-01T12:00:00.000Z'
    );
    expect(toIsoTimestamp('1706788800')).toBe('2024-02-01T12:00:00.000Z');
  });
});
