import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

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
const ORIGINAL_STANDUP_ALIASES = process.env.STANDUP_LABEL_ALIASES;
const ORIGINAL_INTERNSHIP_ALIASES = process.env.INTERNSHIP_LABEL_ALIASES;

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
    delete process.env.STANDUP_LABEL_ALIASES;
    delete process.env.INTERNSHIP_LABEL_ALIASES;
  });

  afterEach(() => {
    if (ORIGINAL_STANDUP_ALIASES === undefined) {
      delete process.env.STANDUP_LABEL_ALIASES;
    } else {
      process.env.STANDUP_LABEL_ALIASES = ORIGINAL_STANDUP_ALIASES;
    }

    if (ORIGINAL_INTERNSHIP_ALIASES === undefined) {
      delete process.env.INTERNSHIP_LABEL_ALIASES;
    } else {
      process.env.INTERNSHIP_LABEL_ALIASES = ORIGINAL_INTERNSHIP_ALIASES;
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
  });

  test('verifyStandupSubmission reads label aliases from environment variables', async () => {
    process.env.STANDUP_LABEL_ALIASES = 'daily-standup';
    process.env.INTERNSHIP_LABEL_ALIASES = 'internship-track';

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
  });
});
