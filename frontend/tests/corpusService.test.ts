import { afterEach, expect, test, vi } from 'vite-plus/test';

import {
  configureCorpusService,
  getAudioRecordUrl,
  getInternAudios,
  searchInternById,
  searchInternsByName,
} from '../src/services/corpus/corpusService.ts';

interface FetchCall {
  url: string;
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    cache?: string;
  };
}

function mockResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

afterEach(() => {
  configureCorpusService({
    baseUrl: '',
    authToken: '',
    useMock: false,
    fetcher: async () => mockResponse(404, {}),
  });
});

test('searchInternById uses configured base URL/auth header and parses profile payload', async () => {
  const calls: FetchCall[] = [];

  configureCorpusService({
    baseUrl: 'https://api.example.test/',
    authToken: 'token-123',
    useMock: false,
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return mockResponse(200, {
        data: {
          user_id: 'intern_1',
          full_name: 'Intern One',
        },
      });
    },
  });

  const profile = await searchInternById(' intern_1 ');

  expect(profile).toEqual({ id: 'intern_1', name: 'Intern One' });
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe('https://api.example.test/api/v1/users/intern_1');
  expect(calls[0].init?.method).toBe('GET');
  expect(calls[0].init?.cache).toBe('no-store');
  expect(calls[0].init?.headers?.Accept).toBe('application/json');
  expect(calls[0].init?.headers?.['Cache-Control']).toBe('no-cache');
  expect(calls[0].init?.headers?.Pragma).toBe('no-cache');
  expect(calls[0].init?.headers?.Authorization).toBe('Bearer token-123');
});

test('searchInternById throws for blank intern ids', async () => {
  await expect(searchInternById('   ')).rejects.toThrow('internId is required');
});

test('searchInternById falls back to requested id on 404', async () => {
  configureCorpusService({
    fetcher: async () => mockResponse(404, { detail: 'Not Found' }),
  });

  const profile = await searchInternById('missing-user');

  expect(profile).toEqual({ id: 'missing-user' });
});

test('searchInternById falls back when payload is not a record and when name is missing', async () => {
  configureCorpusService({
    fetcher: async (url) => {
      if (url.endsWith('/intern-text')) {
        return mockResponse(200, 'not-an-object');
      }

      return mockResponse(200, {
        id: 'intern-object',
      });
    },
  });

  await expect(searchInternById('intern-text')).resolves.toEqual({
    id: 'intern-text',
  });
  await expect(searchInternById('intern-object')).resolves.toEqual({
    id: 'intern-object',
  });
});

test('searchInternById falls back to requested id when no fetcher is configured', async () => {
  configureCorpusService({ fetcher: null });

  const profile = await searchInternById(' intern_0 ');

  expect(profile).toEqual({ id: 'intern_0' });
});

test('configureCorpusService preserves the current fetcher when fetcher is omitted', async () => {
  configureCorpusService({
    fetcher: async () =>
      mockResponse(200, {
        id: 'intern_preserved',
      }),
  });
  configureCorpusService({
    baseUrl: 'https://api.example.test',
  });

  await expect(searchInternById('intern_preserved')).resolves.toEqual({
    id: 'intern_preserved',
  });
});

test('corpus service resolves without a global fetch implementation', async () => {
  const globalScope = globalThis as {
    fetch?: typeof globalThis.fetch;
  };
  const originalFetch = globalScope.fetch;

  vi.resetModules();
  globalScope.fetch = undefined;

  try {
    const corpusModule =
      await import('../src/services/corpus/corpusService.ts');

    await expect(
      corpusModule.searchInternById('intern_no_fetch')
    ).resolves.toEqual({
      id: 'intern_no_fetch',
    });
  } finally {
    globalScope.fetch = originalFetch;
    vi.resetModules();
  }
});

test('searchInternsByName returns empty array for blank query without requesting API', async () => {
  let callCount = 0;
  configureCorpusService({
    fetcher: async () => {
      callCount += 1;
      return mockResponse(200, []);
    },
  });

  const results = await searchInternsByName('   ');

  expect(results).toEqual([]);
  expect(callCount).toBe(0);
});

test('searchInternsByName supports mock mode and returns an empty list on 404', async () => {
  configureCorpusService({
    useMock: true,
    fetcher: async () => {
      throw new Error('fetcher should not be called in mock mode');
    },
  });

  await expect(searchInternsByName('Alice')).resolves.toEqual([]);

  configureCorpusService({
    useMock: false,
    fetcher: async () => mockResponse(404, { detail: 'Not Found' }),
  });

  await expect(searchInternsByName('Alice')).resolves.toEqual([]);
});

test('searchInternsByName parses nested results collections and filters invalid entries', async () => {
  configureCorpusService({
    fetcher: async () =>
      mockResponse(200, {
        data: {
          results: [
            null,
            {
              data: {
                userId: 'intern_2',
                displayName: 'Intern Two',
              },
            },
            {
              id: 'intern_3',
              username: 'intern-three',
            },
            {
              username: 'missing-id',
            },
          ],
        },
      }),
  });

  const results = await searchInternsByName(' intern ');

  expect(results).toEqual([
    { id: 'intern_2', name: 'Intern Two' },
    { id: 'intern_3', name: 'intern-three' },
  ]);
});

test('searchInternsByName returns an empty list for unsupported payload shapes', async () => {
  configureCorpusService({
    fetcher: async () => mockResponse(200, 12345),
  });

  await expect(searchInternsByName('intern')).resolves.toEqual([]);
});

test('searchInternsByName supports direct arrays and record payloads with no array collections', async () => {
  configureCorpusService({
    fetcher: async (url) => {
      if (url.includes('query=array')) {
        return mockResponse(200, [
          {
            id: 'intern_array',
            name: 'Array Result',
          },
        ]);
      }

      return mockResponse(200, {
        data: {
          profile: {
            id: 'ignored',
          },
        },
      });
    },
  });

  await expect(searchInternsByName('array')).resolves.toEqual([
    { id: 'intern_array', name: 'Array Result' },
  ]);
  await expect(searchInternsByName('record-only')).resolves.toEqual([]);
});

test('getInternAudios extracts normalized audio metadata from mixed payload fields', async () => {
  configureCorpusService({
    fetcher: async () =>
      mockResponse(200, {
        records: [
          {
            record_id: 'audio_1',
            category: 'standup;daily',
            tags: [{ name: 'internship' }],
            created_at: '2026-02-20T10:00:00Z',
            audio_url: 'https://cdn.example.test/audio_1.wav',
          },
        ],
      }),
  });

  const audios = await getInternAudios('intern_1');

  expect(audios).toHaveLength(1);
  expect(audios[0].id).toBe('audio_1');
  expect(audios[0].category).toBe('standup');
  expect(audios[0].tag).toBe('internship');
  expect(audios[0].labels).toContain('standup');
  expect(audios[0].labels).toContain('daily');
  expect(audios[0].labels).toContain('internship');
  expect(audios[0].uploadedAt).toBe('2026-02-20T10:00:00.000Z');
  expect(audios[0].audioUrl).toBe('https://cdn.example.test/audio_1.wav');
});

test('getInternAudios handles nested payload collections, fallback ids, and date edge cases', async () => {
  configureCorpusService({
    fetcher: async () =>
      mockResponse(200, {
        contributions: {
          audio: [
            null,
            {
              categories: {
                nested: {
                  deeper: 'Standup',
                },
              },
              domains: [{ label: 'Internship' }],
              metadata: {
                created: {
                  value: '2026-02-20T10:00:00Z',
                },
              },
              recordUrl: 'https://cdn.example.test/audio_fallback.wav',
            },
            {
              uuid: 'audio_3',
              category: ' [standup] / "Daily" ',
              labels: [[[[[[['ignored-too-deep']]]]]]],
              tags: {
                nested: [{ slug: 'internship' }],
              },
              submittedAt: {
                value: 1704067200,
              },
              url: 'https://cdn.example.test/audio_3.wav',
            },
            {
              id: 'audio_4',
              category: 'standup',
              tag: 'internship',
              datetime: 'not-a-date',
            },
            {
              id: 'audio_5',
              category: '',
              labels: ['   ', '!!!'],
              submittedAt: {
                value: Number.MAX_SAFE_INTEGER,
              },
              metadata: 12345,
            },
            {
              id: 'audio_6',
              category: 'standup',
              tag: 'internship',
              uploadedAt: {
                value: 'not-a-date',
              },
            },
            {
              id: 'audio_7',
              category: 'standup',
            },
          ],
        },
      }),
  });

  const audios = await getInternAudios('intern_1');

  expect(audios).toHaveLength(6);
  expect(audios[0]).toMatchObject({
    id: 'audio-2',
    category: 'Standup',
    tag: 'Internship',
    uploadedAt: '2026-02-20T10:00:00.000Z',
    audioUrl: 'https://cdn.example.test/audio_fallback.wav',
  });
  expect(audios[1]).toMatchObject({
    id: 'audio_3',
    category: 'standup',
    tag: 'internship',
    uploadedAt: '2024-01-01T00:00:00.000Z',
    audioUrl: 'https://cdn.example.test/audio_3.wav',
  });
  expect(audios[1].labels).toEqual(
    expect.arrayContaining(['standup', 'Daily', 'internship'])
  );
  expect(audios[1].labels).not.toContain('ignored-too-deep');
  expect(audios[2]).toMatchObject({
    id: 'audio_4',
    category: 'standup',
    tag: 'internship',
    uploadedAt: undefined,
  });
  expect(audios[3]).toMatchObject({
    id: 'audio_5',
    category: '',
    tag: '!!!',
    uploadedAt: undefined,
  });
  expect(audios[4]).toMatchObject({
    id: 'audio_6',
    category: 'standup',
    tag: 'internship',
    uploadedAt: undefined,
  });
  expect(audios[5]).toMatchObject({
    id: 'audio_7',
    category: 'standup',
    tag: '',
    uploadedAt: undefined,
  });
});

test('getInternAudios returns an empty list on 404', async () => {
  configureCorpusService({
    fetcher: async () => mockResponse(404, { detail: 'Not Found' }),
  });

  await expect(getInternAudios('intern_404')).resolves.toEqual([]);
});

test('getInternAudios treats timezone-less backend timestamps as GMT', async () => {
  configureCorpusService({
    fetcher: async () =>
      mockResponse(200, [
        {
          id: 'audio_gmt',
          category: 'standup',
          tag: 'internship',
          uploadedAt: '2026-02-10T03:40:00',
        },
      ]),
  });

  const audios = await getInternAudios('intern_gmt');

  expect(audios).toEqual([
    {
      id: 'audio_gmt',
      category: 'standup',
      tag: 'internship',
      labels: ['standup', 'internship'],
      uploadedAt: '2026-02-10T03:40:00.000Z',
      audioUrl: undefined,
    },
  ]);
});

test('getAudioRecordUrl returns URL from nested payload data and ignores blank input', async () => {
  const calls: FetchCall[] = [];

  configureCorpusService({
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return mockResponse(200, {
        data: {
          record_url: 'https://cdn.example.test/record_9.wav',
        },
      });
    },
  });

  const blankResult = await getAudioRecordUrl('   ');
  const urlResult = await getAudioRecordUrl('record_9');

  expect(blankResult).toBeUndefined();
  expect(urlResult).toBe('https://cdn.example.test/record_9.wav');
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe('/api/v1/records/record_9/record-url');
});

test('getAudioRecordUrl returns top-level URLs and handles malformed payloads', async () => {
  configureCorpusService({
    fetcher: async (url) => {
      if (url.endsWith('/record-top/record-url')) {
        return mockResponse(200, {
          url: 'https://cdn.example.test/record_top.wav',
        });
      }

      if (url.endsWith('/record-data-text/record-url')) {
        return mockResponse(200, {
          data: 'not-an-object',
        });
      }

      return mockResponse(200, 'not-an-object');
    },
  });

  const topLevelUrl = await getAudioRecordUrl('record-top');
  const nonRecordDataUrl = await getAudioRecordUrl('record-data-text');
  const malformedUrl = await getAudioRecordUrl('record-bad');

  expect(topLevelUrl).toBe('https://cdn.example.test/record_top.wav');
  expect(nonRecordDataUrl).toBeUndefined();
  expect(malformedUrl).toBeUndefined();
});

test('corpus service throws for non-404 API errors', async () => {
  configureCorpusService({
    fetcher: async () => mockResponse(500, { detail: 'server error' }),
  });

  await expect(getInternAudios('intern_1')).rejects.toThrow(
    /Corpus API request failed \(500\)/
  );
});

test('mock mode bypasses network calls and returns deterministic values', async () => {
  configureCorpusService({
    useMock: true,
    fetcher: async () => {
      throw new Error('fetcher should not be called in mock mode');
    },
  });

  const profile = await searchInternById('intern_100');
  const audios = await getInternAudios('intern_100');
  const audioUrl = await getAudioRecordUrl('record_100');

  expect(profile).toEqual({ id: 'intern_100' });
  expect(audios).toEqual([]);
  expect(audioUrl).toBeUndefined();
});
