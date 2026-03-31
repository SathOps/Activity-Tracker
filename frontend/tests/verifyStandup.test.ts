import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test';

import type { InternAudioMetadata } from '../src/services/corpus/corpusService.ts';
import { getInternAudios } from '../src/services/corpus';
import {
  isValidStandupSubmissionAudio,
  verifyStandupSubmission,
} from '../src/utils/verification/verifyStandup.ts';

vi.mock('../src/services/corpus', () => ({
  getInternAudios: vi.fn(),
}));

const mockedGetInternAudios = vi.mocked(getInternAudios);
const globalScope = globalThis as {
  process?: {
    env?: Record<string, string | undefined>;
  };
};
const processEnv =
  globalScope.process?.env ??
  ((globalScope.process ??= {
    env: {},
  }).env ??= {});
const ORIGINAL_STANDUP_ALIASES = processEnv.STANDUP_LABEL_ALIASES;
const ORIGINAL_INTERNSHIP_ALIASES = processEnv.INTERNSHIP_LABEL_ALIASES;

function buildAudio(
  overrides: Partial<InternAudioMetadata> = {}
): InternAudioMetadata {
  return {
    id: 'audio-1',
    category: 'standup',
    tag: 'internship',
    labels: [],
    uploadedAt: '2026-02-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('verifyStandup', () => {
  beforeEach(() => {
    mockedGetInternAudios.mockReset();
    delete processEnv.STANDUP_LABEL_ALIASES;
    delete processEnv.INTERNSHIP_LABEL_ALIASES;
  });

  afterEach(() => {
    if (ORIGINAL_STANDUP_ALIASES === undefined) {
      delete processEnv.STANDUP_LABEL_ALIASES;
    } else {
      processEnv.STANDUP_LABEL_ALIASES = ORIGINAL_STANDUP_ALIASES;
    }

    if (ORIGINAL_INTERNSHIP_ALIASES === undefined) {
      delete processEnv.INTERNSHIP_LABEL_ALIASES;
    } else {
      processEnv.INTERNSHIP_LABEL_ALIASES = ORIGINAL_INTERNSHIP_ALIASES;
    }
  });

  test('isValidStandupSubmissionAudio accepts entries with standup and internship labels', () => {
    const result = isValidStandupSubmissionAudio({
      category: 'Stand-Up',
      tag: 'Internship',
      labels: ['Daily Update'],
    });

    expect(result).toBe(true);
  });

  test('isValidStandupSubmissionAudio handles multi-word labels split by spaces', () => {
    const result = isValidStandupSubmissionAudio({
      category: 'Daily Standup Entry',
      tag: 'Internship Track',
      labels: [],
    });

    expect(result).toBe(true);
  });

  test('isValidStandupSubmissionAudio rejects entries missing internship label', () => {
    const result = isValidStandupSubmissionAudio({
      category: 'standup',
      tag: 'daily',
      labels: [],
    });

    expect(result).toBe(false);
  });

  test('isValidStandupSubmissionAudio requires distinct alias matches', () => {
    const result = isValidStandupSubmissionAudio(
      {
        category: 'internship',
        tag: 'internship',
        labels: [],
      },
      {
        standupAliases: new Set(['internship']),
        internshipAliases: new Set(['internship']),
      }
    );

    expect(result).toBe(false);
  });

  test('isValidStandupSubmissionAudio accepts the same alias when category and tag fields are distinct', () => {
    const result = isValidStandupSubmissionAudio(
      {
        category: 'c81f5d73-9090-453e-bb08-c2f46453e0bd',
        tag: 'c81f5d73-9090-453e-bb08-c2f46453e0bd',
        labels: [],
      },
      {
        standupAliases: new Set(['c81f5d739090453ebb08c2f46453e0bd']),
        internshipAliases: new Set(['c81f5d739090453ebb08c2f46453e0bd']),
      }
    );

    expect(result).toBe(true);
  });

  test('verifyStandupSubmission filters by date and marks completed when at least one valid audio exists', async () => {
    mockedGetInternAudios.mockResolvedValue([
      buildAudio({
        id: 'audio-valid',
        category: 'standup',
        tag: 'internship',
        uploadedAt: '2026-02-10T10:00:00.000Z',
      }),
      buildAudio({
        id: 'audio-other-date',
        category: 'standup',
        tag: 'internship',
        uploadedAt: '2026-02-11T10:00:00.000Z',
      }),
      buildAudio({
        id: 'audio-invalid-tag',
        category: 'standup',
        tag: 'other',
        uploadedAt: '2026-02-10T11:00:00.000Z',
      }),
    ]);

    const result = await verifyStandupSubmission('intern-1', {
      uploadedOnDate: '2026-02-10',
    });

    expect(mockedGetInternAudios).toHaveBeenCalledWith('intern-1');
    expect(result.internId).toBe('intern-1');
    expect(result.checkedDate).toBe('2026-02-10');
    expect(result.validCount).toBe(1);
    expect(result.status).toBe('COMPLETED');
    expect(result.audios?.map((audio) => audio.id)).toEqual(['audio-valid']);
    expect(result.slotStatuses).toEqual([
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
        status: 'MISSING',
      },
      {
        slotId: 'S3',
        label: 'Standup 3',
        windowLabel: '14:00-14:30',
        status: 'DELAYED',
        uploadedAt: '2026-02-10T10:00:00.000Z',
        audioId: 'audio-valid',
      },
      {
        slotId: 'S4',
        label: 'Standup 4',
        windowLabel: '16:30-17:00',
        status: 'MISSING',
      },
    ]);
  });

  test('verifyStandupSubmission marks pending when no valid submission exists', async () => {
    mockedGetInternAudios.mockResolvedValue([
      buildAudio({
        id: 'audio-invalid',
        category: 'daily',
        tag: 'other',
      }),
    ]);

    const result = await verifyStandupSubmission('intern-2');

    expect(result.validCount).toBe(0);
    expect(result.status).toBe('PENDING');
    expect(result.audios).toEqual([]);
    expect(result.slotStatuses.every((slot) => slot.status === 'MISSING')).toBe(
      true
    );
  });

  test('verifyStandupSubmission reads label aliases from environment variables', async () => {
    processEnv.STANDUP_LABEL_ALIASES = 'daily-standup';
    processEnv.INTERNSHIP_LABEL_ALIASES = 'internship-track';

    mockedGetInternAudios.mockResolvedValue([
      buildAudio({
        id: 'audio-env',
        category: 'Daily Standup',
        tag: 'Internship Track',
      }),
    ]);

    const result = await verifyStandupSubmission('intern-3');

    expect(result.validCount).toBe(1);
    expect(result.status).toBe('COMPLETED');
  });

  test('verifyStandupSubmission throws for invalid date filters', async () => {
    mockedGetInternAudios.mockResolvedValue([]);

    await expect(
      verifyStandupSubmission('intern-4', { uploadedOnDate: '2026-13-40' })
    ).rejects.toThrow('uploadedOnDate must be a valid date');

    await expect(
      verifyStandupSubmission('intern-4', {
        uploadedOnDate: 'definitely-not-a-date',
      })
    ).rejects.toThrow('uploadedOnDate must be a valid date');
  });

  test('verifyStandupSubmission supports alias arrays and parses non-YYYY-MM-DD date strings', async () => {
    mockedGetInternAudios.mockResolvedValue([
      buildAudio({
        id: 'audio-valid',
        category: 'Daily Standup',
        tag: 'Internship Track',
        uploadedAt: '2026-02-10T10:00:00.000Z',
      }),
      buildAudio({
        id: 'audio-missing-date',
        category: 'Daily Standup',
        tag: 'Internship Track',
        uploadedAt: undefined,
      }),
      buildAudio({
        id: 'audio-invalid-date',
        category: 'Daily Standup',
        tag: 'Internship Track',
        uploadedAt: 'not-a-date',
      }),
    ]);

    const result = await verifyStandupSubmission('  intern-5  ', {
      uploadedOnDate: '2026-02-10T12:00:00Z',
      standupAliases: ['!!!', 'daily standup', 'progress update'],
      internshipAliases: ['   ', 'internship track', 'internship program'],
    });

    expect(mockedGetInternAudios).toHaveBeenCalledWith('intern-5');
    expect(result.checkedDate).toBe('2026-02-10');
    expect(result.validCount).toBe(1);
    expect(result.audios?.map((audio) => audio.id)).toEqual(['audio-valid']);
  });

  test('verifyStandupSubmission treats blank uploadedOnDate as no filter and rejects blank intern ids', async () => {
    mockedGetInternAudios.mockResolvedValue([buildAudio({ id: 'audio-any' })]);

    const result = await verifyStandupSubmission('intern-6', {
      uploadedOnDate: '   ',
    });

    expect(result.checkedDate).toBeUndefined();
    expect(result.validCount).toBe(1);
    await expect(verifyStandupSubmission('   ')).rejects.toThrow(
      'internId is required'
    );
  });

  test('isValidStandupSubmissionAudio ignores blank alias tokens and works without labels', () => {
    const result = isValidStandupSubmissionAudio(
      {
        category: 'Daily Standup',
        tag: 'Internship Track',
        labels: ['!!!'],
      },
      {
        standupAliases: new Set(['', 'standup']),
        internshipAliases: new Set(['', 'internship']),
      }
    );

    expect(result).toBe(true);
  });

  test('isValidStandupSubmissionAudio works when labels are omitted entirely', () => {
    const result = isValidStandupSubmissionAudio({
      category: 'standup',
      tag: 'internship',
    });

    expect(result).toBe(true);
  });

  test('verifyStandupSubmission matches selected dates using IST for UTC corpus timestamps', async () => {
    mockedGetInternAudios.mockResolvedValue([
      buildAudio({
        id: 'audio-ist-date',
        uploadedAt: '2026-02-09T18:45:00.000Z',
      }),
    ]);

    const result = await verifyStandupSubmission('intern-5', {
      uploadedOnDate: '2026-02-10',
    });

    expect(result.validCount).toBe(0);
    expect(result.status).toBe('PENDING');
    expect(result.audios?.map((audio) => audio.id)).toEqual(['audio-ist-date']);
  });

  test('verifyStandupSubmission treats timezone-less corpus timestamps as GMT before IST slot matching', async () => {
    mockedGetInternAudios.mockResolvedValue([
      buildAudio({
        id: 'audio-gmt-no-zone',
        uploadedAt: '2026-02-10T03:40:00',
      }),
    ]);

    const result = await verifyStandupSubmission('intern-7', {
      uploadedOnDate: '2026-02-10',
    });

    expect(result.validCount).toBe(1);
    expect(result.status).toBe('COMPLETED');
    expect(result.slotStatuses[0]).toEqual({
      slotId: 'S1',
      label: 'Standup 1',
      windowLabel: '09:00-09:30',
      status: 'GOOD',
      uploadedAt: '2026-02-10T03:40:00',
      audioId: 'audio-gmt-no-zone',
    });
  });
});
