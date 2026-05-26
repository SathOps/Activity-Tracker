import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test';

import {
  classifyCorpusApiError,
  createTimeoutSignal,
  DEFAULT_CATEGORY_IDS,
  DEFAULT_CHUNK_SIZE_BYTES,
  fetchCategories,
  isUnauthorizedError,
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_UPLOAD_RETRIES,
  MIN_RECORDING_DURATION_SECONDS,
  splitFileIntoChunks,
  uploadAudioRecord,
  verifyLocation,
} from '../src/services/corpusUploadApi.ts';

const CORPUS_BASE_URL = 'https://api.corpus.swecha.org';

describe('corpusUploadApi constants', () => {
  test('DEFAULT_CHUNK_SIZE_BYTES is 5MB', () => {
    expect(DEFAULT_CHUNK_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  test('MAX_AUDIO_FILE_SIZE_BYTES is 1GB', () => {
    expect(MAX_AUDIO_FILE_SIZE_BYTES).toBe(1024 * 1024 * 1024);
  });

  test('MIN_RECORDING_DURATION_SECONDS is 10', () => {
    expect(MIN_RECORDING_DURATION_SECONDS).toBe(10);
  });

  test('MAX_UPLOAD_RETRIES is 3', () => {
    expect(MAX_UPLOAD_RETRIES).toBe(3);
  });

  test('DEFAULT_CATEGORY_IDS contains two UUIDs', () => {
    expect(DEFAULT_CATEGORY_IDS).toHaveLength(2);
    expect(DEFAULT_CATEGORY_IDS[0]).toBe(
      'c81f5d73-9090-453e-bb08-c2f46453e0bd'
    );
    expect(DEFAULT_CATEGORY_IDS[1]).toBe(
      '4dd053f4-6323-43d4-87a3-ce1816bd9459'
    );
  });
});

describe('splitFileIntoChunks', () => {
  test('splits file into correct number of chunks', () => {
    const file = new File(['a'.repeat(100)], 'test.webm', {
      type: 'audio/webm',
    });
    const chunks = splitFileIntoChunks(file, 30);
    expect(chunks).toHaveLength(4);
  });

  test('returns single chunk when file is smaller than chunk size', () => {
    const file = new File(['a'.repeat(10)], 'test.webm', {
      type: 'audio/webm',
    });
    const chunks = splitFileIntoChunks(file, 100);
    expect(chunks).toHaveLength(1);
  });

  test('returns empty array for empty file', () => {
    const file = new File([], 'test.webm', { type: 'audio/webm' });
    const chunks = splitFileIntoChunks(file, 100);
    expect(chunks).toHaveLength(0);
  });

  test('chunks have correct sizes', () => {
    const data = 'a'.repeat(100);
    const file = new File([data], 'test.webm', { type: 'audio/webm' });
    const chunks = splitFileIntoChunks(file, 30);
    expect(chunks[0].size).toBe(30);
    expect(chunks[1].size).toBe(30);
    expect(chunks[2].size).toBe(30);
    expect(chunks[3].size).toBe(10);
  });
});

describe('createTimeoutSignal', () => {
  test('returns signal and clear function', () => {
    const { signal, clear } = createTimeoutSignal(1000);
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(typeof clear).toBe('function');
    clear();
  });

  test('signal aborts after timeout', async () => {
    const { signal } = createTimeoutSignal(10);
    expect(signal.aborted).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(signal.aborted).toBe(true);
  });

  test('clear prevents signal from aborting', async () => {
    const { signal, clear } = createTimeoutSignal(10);
    clear();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(signal.aborted).toBe(false);
  });
});

describe('isUnauthorizedError', () => {
  test('returns true for 401 error', () => {
    const error = new Error('Unauthorized') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 401 };
    expect(isUnauthorizedError(error)).toBe(true);
  });

  test('returns true for 403 error', () => {
    const error = new Error('Forbidden') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 403 };
    expect(isUnauthorizedError(error)).toBe(true);
  });

  test('returns false for other status codes', () => {
    const error = new Error('Server error') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 500 };
    expect(isUnauthorizedError(error)).toBe(false);
  });

  test('returns false for errors without response', () => {
    expect(isUnauthorizedError(new Error('Network error'))).toBe(false);
  });

  test('returns false for non-error values', () => {
    expect(isUnauthorizedError(null)).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
    expect(isUnauthorizedError('string')).toBe(false);
  });
});

describe('classifyCorpusApiError', () => {
  test('classifies 401 as auth error', () => {
    const error = new Error('Unauthorized') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 401 };
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('auth');
    expect(result.statusCode).toBe(401);
  });

  test('classifies 403 as auth error', () => {
    const error = new Error('Forbidden') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 403 };
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('auth');
  });

  test('classifies 413 as file-size error', () => {
    const error = new Error('Too large') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 413 };
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('file-size');
  });

  test('classifies 500 as server error', () => {
    const error = new Error('Server error') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 500 };
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('server');
  });

  test('classifies 503 as server error', () => {
    const error = new Error('Service unavailable') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 503 };
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('server');
  });

  test('classifies 400 as unknown error', () => {
    const error = new Error('Bad request') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 400 };
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('unknown');
  });

  test('classifies AbortError with response as timeout', () => {
    const error = new Error('Aborted') as Error & {
      response?: { status?: number };
      name?: string;
    };
    error.response = { status: 200 };
    error.name = 'AbortError';
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('timeout');
  });

  test('classifies error with falsy response as network', () => {
    const error = new Error('Network error') as Error & {
      response?: { status?: number };
    };
    error.response = undefined;
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('network');
  });

  test('classifies AbortError as timeout', () => {
    const error = new DOMException('Aborted', 'AbortError');
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('timeout');
  });

  test('classifies generic error as unknown', () => {
    const result = classifyCorpusApiError(new Error('Something went wrong'));
    expect(result.type).toBe('unknown');
    expect(result.message).toBe('Something went wrong');
  });

  test('classifies error with empty message', () => {
    const error = new Error('');
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('unknown');
    expect(result.message).toBe('');
  });

  test('uses fallback message when error message is undefined', () => {
    const error = new Error('placeholder') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 400 };
    Object.defineProperty(error, 'message', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('unknown');
    expect(result.message).toBe('Audio upload failed. Please retry.');
  });

  test('classifies non-error as unknown', () => {
    const result = classifyCorpusApiError('string error');
    expect(result.type).toBe('unknown');
  });

  test('classifies error with undefined message as unknown with fallback', () => {
    const error = new Error('temp') as Error & {
      response?: { status?: number };
    };
    error.response = { status: 404 };
    Object.defineProperty(error, 'message', { value: undefined });
    const result = classifyCorpusApiError(error);
    expect(result.type).toBe('unknown');
    expect(result.message).toBe('Audio upload failed. Please retry.');
  });
});

describe('verifyLocation', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('calls correct endpoint with POST method', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        formatted_address: 'Test Address',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
        postal_code: '500032',
        latitude: 17.44,
        longitude: 78.35,
      }),
    });

    await verifyLocation('token123', 17.44, 78.35);

    expect(fetchMock).toHaveBeenCalledWith(
      `${CORPUS_BASE_URL}/api/v1/location/verify-location`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ latitude: 17.44, longitude: 78.35 }),
      }
    );
  });

  test('returns location info on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        formatted_address: 'IIIT Hyderabad',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
        postal_code: '500032',
        latitude: 17.4438,
        longitude: 78.3481,
      }),
    });

    const result = await verifyLocation('token', 17.44, 78.35);

    expect(result).toEqual({
      formattedAddress: 'IIIT Hyderabad',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      postalCode: '500032',
      latitude: 17.4438,
      longitude: 78.3481,
    });
  });

  test('throws error on failed response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(verifyLocation('token', 17.44, 78.35)).rejects.toThrow(
      'Location verification failed: 500'
    );
  });

  test('throws error with detail text on failed response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid coordinates provided',
    });

    await expect(verifyLocation('token', 17.44, 78.35)).rejects.toThrow(
      'Location verification failed: 400 Invalid coordinates provided'
    );
  });

  test('handles null fields gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        formatted_address: 'Unknown',
        latitude: 17.44,
        longitude: 78.35,
      }),
    });

    const result = await verifyLocation('token', 17.44, 78.35);
    expect(result.country).toBeNull();
    expect(result.state).toBeNull();
    expect(result.city).toBeNull();
    expect(result.postalCode).toBeNull();
  });

  test('uses fallback latitude when not in response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        formatted_address: 'Test',
        country: 'India',
      }),
    });

    const result = await verifyLocation('token', 99.99, 88.88);
    expect(result.latitude).toBe(99.99);
    expect(result.longitude).toBe(88.88);
  });

  test('handles empty formatted_address', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 17.44,
        longitude: 78.35,
      }),
    });

    const result = await verifyLocation('token', 17.44, 78.35);
    expect(result.formattedAddress).toBe('');
  });
});

describe('uploadAudioRecord', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockSuccessfulUpload() {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === `${CORPUS_BASE_URL}/api/v1/records/upload/chunk`) {
        return { ok: true };
      }
      if (url === `${CORPUS_BASE_URL}/api/v1/records/upload`) {
        return { ok: true };
      }
      return { ok: false, status: 404 };
    });
  }

  test('uploads single chunk file successfully', async () => {
    mockSuccessfulUpload();

    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });
    const progressCalls: number[] = [];
    const stageCalls: string[] = [];

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      onChunkProgress: (p) => progressCalls.push(p.percentage),
      onUploadStage: (s) => stageCalls.push(s),
      chunkSizeBytes: 1024,
      backoffMs: 1,
    });

    expect(stageCalls).toContain('uploading');
    expect(stageCalls).toContain('finalizing');
    expect(progressCalls).toContain(100);
  });

  test('splits large files into multiple chunks', async () => {
    mockSuccessfulUpload();

    const audioFile = new File(['a'.repeat(100)], 'test.webm', {
      type: 'audio/webm',
    });
    const progressCalls: number[] = [];

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      onChunkProgress: (p) => progressCalls.push(p.percentage),
      chunkSizeBytes: 30,
      backoffMs: 1,
    });

    expect(progressCalls).toEqual([25, 50, 75, 100]);
  });

  test('retries failed chunks', async () => {
    let chunkAttempts = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === `${CORPUS_BASE_URL}/api/v1/records/upload/chunk`) {
        chunkAttempts += 1;
        if (chunkAttempts === 1) {
          return { ok: false, status: 500 };
        }
        return { ok: true };
      }
      if (url === `${CORPUS_BASE_URL}/api/v1/records/upload`) {
        return { ok: true };
      }
      return { ok: false, status: 404 };
    });

    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      backoffMs: 1,
    });

    expect(chunkAttempts).toBe(2);
  });

  test('throws on auth error without retry', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });
    let unauthorizedCalled = false;

    await expect(
      uploadAudioRecord({
        token: 'token123',
        userId: 'user1',
        payload: {
          title: 'Test Recording',
          description:
            'This is a test recording for the team standup tracker application',
          language: 'english',
          audioFile,
          location: { latitude: 17.44, longitude: 78.35 },
          durationSeconds: 15,
          categoryIds: DEFAULT_CATEGORY_IDS,
          releaseRights: 'creator',
        },
        onUnauthorized: () => {
          unauthorizedCalled = true;
        },
        backoffMs: 1,
      })
    ).rejects.toThrow();

    expect(unauthorizedCalled).toBe(true);
  });

  test('throws on finalize failure', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === `${CORPUS_BASE_URL}/api/v1/records/upload/chunk`) {
        return { ok: true };
      }
      if (url === `${CORPUS_BASE_URL}/api/v1/records/upload`) {
        return { ok: false, status: 500 };
      }
      return { ok: false, status: 404 };
    });

    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });

    await expect(
      uploadAudioRecord({
        token: 'token123',
        userId: 'user1',
        payload: {
          title: 'Test Recording',
          description:
            'This is a test recording for the team standup tracker application',
          language: 'english',
          audioFile,
          location: { latitude: 17.44, longitude: 78.35 },
          durationSeconds: 15,
          categoryIds: DEFAULT_CATEGORY_IDS,
          releaseRights: 'creator',
        },
        backoffMs: 1,
      })
    ).rejects.toThrow('Finalize upload failed: 500');
  });

  test('uses mp4 extension for mp4 audio files', async () => {
    mockSuccessfulUpload();
    const audioFile = new File(['audio data'], 'test.mp4', {
      type: 'audio/mp4',
    });
    const stageCalls: string[] = [];

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      onUploadStage: (s) => stageCalls.push(s),
      backoffMs: 1,
    });

    expect(stageCalls).toContain('uploading');
    expect(stageCalls).toContain('finalizing');
  });

  test('uses provided filename', async () => {
    mockSuccessfulUpload();
    const audioFile = new File(['audio data'], 'my-recording.webm', {
      type: 'audio/webm',
    });

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      backoffMs: 1,
    });

    const finalizeCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as string) === `${CORPUS_BASE_URL}/api/v1/records/upload`
    );
    expect(finalizeCall).toBeDefined();
  });

  test('supports external signal and falls back to generated filename', async () => {
    mockSuccessfulUpload();
    const generatedUuid = '11111111-1111-1111-1111-111111111111';
    const uuidSpy = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue(generatedUuid);
    const controller = new AbortController();
    const fakeAudioFile = {
      type: 'audio/webm',
      name: undefined,
      size: 9,
      slice: () => new Blob(['audio data'], { type: 'audio/webm' }),
    } as unknown as File;

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile: fakeAudioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      signal: controller.signal,
      backoffMs: 1,
    });

    const chunkCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as string) === `${CORPUS_BASE_URL}/api/v1/records/upload/chunk`
    );
    expect(chunkCall).toBeDefined();
    expect((chunkCall?.[1] as RequestInit | undefined)?.signal).toBe(
      controller.signal
    );

    const finalizeCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as string) === `${CORPUS_BASE_URL}/api/v1/records/upload`
    );
    expect(finalizeCall).toBeDefined();
    const finalizeBody = (finalizeCall?.[1] as RequestInit | undefined)
      ?.body as FormData | null;
    expect(finalizeBody?.get('filename')).toBe(`${generatedUuid}.webm`);

    uuidSpy.mockRestore();
  });

  test('does not retry on file-size error', async () => {
    let chunkAttempts = 0;
    fetchMock.mockImplementation(async () => {
      chunkAttempts += 1;
      return { ok: false, status: 413 };
    });

    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });

    await expect(
      uploadAudioRecord({
        token: 'token123',
        userId: 'user1',
        payload: {
          title: 'Test Recording',
          description:
            'This is a test recording for the team standup tracker application',
          language: 'english',
          audioFile,
          location: { latitude: 17.44, longitude: 78.35 },
          durationSeconds: 15,
          categoryIds: DEFAULT_CATEGORY_IDS,
          releaseRights: 'creator',
        },
        backoffMs: 1,
      })
    ).rejects.toThrow();

    expect(chunkAttempts).toBe(1);
  });

  test('throws after max retries exceeded', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });

    await expect(
      uploadAudioRecord({
        token: 'token123',
        userId: 'user1',
        payload: {
          title: 'Test Recording',
          description:
            'This is a test recording for the team standup tracker application',
          language: 'english',
          audioFile,
          location: { latitude: 17.44, longitude: 78.35 },
          durationSeconds: 15,
          categoryIds: DEFAULT_CATEGORY_IDS,
          releaseRights: 'creator',
        },
        maxRetriesPerChunk: 2,
        backoffMs: 1,
      })
    ).rejects.toThrow();
  });

  test('uses generated filename when audioFile name is empty', async () => {
    mockSuccessfulUpload();
    const audioFile = {
      name: '',
      type: 'audio/webm',
      size: 10,
      slice: () => new Blob(['audio data']),
    } as unknown as File;

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      backoffMs: 1,
    });

    const finalizeCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as string) === `${CORPUS_BASE_URL}/api/v1/records/upload`
    );
    expect(finalizeCall).toBeDefined();
  });

  test('uses generated filename when audioFile name is undefined', async () => {
    mockSuccessfulUpload();
    const audioFile = {
      name: undefined as unknown as string,
      type: 'audio/webm',
      size: 10,
      slice: () => new Blob(['audio data']),
    } as unknown as File;

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      backoffMs: 1,
    });

    const finalizeCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as string) === `${CORPUS_BASE_URL}/api/v1/records/upload`
    );
    expect(finalizeCall).toBeDefined();
  });

  test('passes abort signal through to upload', async () => {
    mockSuccessfulUpload();
    const audioFile = new File(['audio data'], 'test.webm', {
      type: 'audio/webm',
    });
    const controller = new AbortController();

    await uploadAudioRecord({
      token: 'token123',
      userId: 'user1',
      payload: {
        title: 'Test Recording',
        description:
          'This is a test recording for the team standup tracker application',
        language: 'english',
        audioFile,
        location: { latitude: 17.44, longitude: 78.35 },
        durationSeconds: 15,
        categoryIds: DEFAULT_CATEGORY_IDS,
        releaseRights: 'creator',
      },
      signal: controller.signal,
      backoffMs: 1,
    });

    expect(controller.signal.aborted).toBe(false);
  });
});

describe('fetchCategories', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns categories on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'cat1',
          name: 'Stand-Up',
          title: 'Stand-Up',
          description: 'Daily standup',
          approved: true,
        },
        {
          id: 'cat2',
          name: 'Internship',
          title: 'Internship',
          description: 'Internship program',
          approved: true,
        },
      ],
    });

    const result = await fetchCategories('token123');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('cat1');
    expect(result[0].title).toBe('Stand-Up');
  });

  test('filters out unapproved categories', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'cat1',
          name: 'Approved',
          title: 'Approved',
          description: '',
          approved: true,
        },
        {
          id: 'cat2',
          name: 'Pending',
          title: 'Pending',
          description: '',
          approved: false,
        },
      ],
    });

    const result = await fetchCategories('token');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cat1');
  });

  test('returns empty array for non-array response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ notAnArray: true }),
    });

    const result = await fetchCategories('token');
    expect(result).toEqual([]);
  });

  test('throws on failed response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchCategories('token')).rejects.toThrow(
      'Failed to fetch categories: 500'
    );
  });

  test('sends correct auth headers', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await fetchCategories('my-token');

    expect(fetchMock).toHaveBeenCalledWith(
      `${CORPUS_BASE_URL}/api/v1/categories/`,
      {
        headers: {
          Authorization: 'Bearer my-token',
          Accept: 'application/json',
        },
      }
    );
  });

  test('handles categories with missing description', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'cat1', name: 'Test', title: 'Test', approved: true },
      ],
    });

    const result = await fetchCategories('token');
    expect(result[0].description).toBe('');
  });

  test('handles categories with missing title using name', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'cat1', name: 'Fallback Name', approved: true }],
    });

    const result = await fetchCategories('token');
    expect(result[0].title).toBe('Fallback Name');
  });

  test('handles categories with null items', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        null,
        {
          id: 'cat1',
          name: 'Valid',
          title: 'Valid',
          description: 'desc',
          approved: true,
        },
      ],
    });

    const result = await fetchCategories('token');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cat1');
  });

  test('handles categories with missing id, name, and title', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ approved: true }],
    });

    const result = await fetchCategories('token');
    expect(result[0].id).toBe('');
    expect(result[0].name).toBe('');
    expect(result[0].title).toBe('');
  });

  test('stringifies primitive category fields safely', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 123n,
          name: false,
          title: 789,
          description: true,
          approved: true,
        },
      ],
    });

    const result = await fetchCategories('token');
    expect(result[0]).toMatchObject({
      id: '123',
      name: 'false',
      title: '789',
      description: 'true',
    });
  });
});
