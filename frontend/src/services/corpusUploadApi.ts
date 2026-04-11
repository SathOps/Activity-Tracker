import type {
  CorpusUploadError,
  CorpusUploadPayload,
  CorpusUploadProgress,
  Category,
} from '../types/corpusUpload';

export const DEFAULT_CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MIN_RECORDING_DURATION_SECONDS = 10;
export const MAX_UPLOAD_RETRIES = 3;
export const DEFAULT_BACKOFF_MS = 400;
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export const DEFAULT_CATEGORY_IDS = [
  'c81f5d73-9090-453e-bb08-c2f46453e0bd',
  '4dd053f4-6323-43d4-87a3-ce1816bd9459',
];
const DEFAULT_MEDIA_TYPE = 'audio';

interface UploadChunkParams {
  token: string;
  chunk: Blob;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  uploadUuid: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface UploadChunkWithRetryParams extends UploadChunkParams {
  maxRetries?: number;
  backoffMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface UploadRecordParams {
  token: string;
  userId: string;
  payload: CorpusUploadPayload;
  onChunkProgress?: (progress: CorpusUploadProgress) => void;
  onUploadStage?: (stage: 'uploading' | 'finalizing') => void;
  onUnauthorized?: () => void;
  chunkSizeBytes?: number;
  maxRetriesPerChunk?: number;
  backoffMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timeoutId);
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof Error && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    const status = response?.status;
    return status === 401 || status === 403;
  }
  return false;
}

export function classifyCorpusApiError(error: unknown): CorpusUploadError {
  if (error instanceof Error && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    const status = response?.status;

    if (status === 401 || status === 403) {
      return {
        type: 'auth',
        message: 'Corpus session expired. Please login again.',
        statusCode: status,
      };
    }

    if (status === 413) {
      return {
        type: 'file-size',
        message: 'Audio file is too large. Please record a shorter clip.',
        statusCode: status,
      };
    }

    if (error.name === 'AbortError') {
      return {
        type: 'timeout',
        message: 'Upload timed out. Please check your connection and retry.',
        statusCode: status,
      };
    }

    if (!response) {
      return {
        type: 'network',
        message: 'Network error while uploading audio. Please retry.',
      };
    }

    if (status && status >= 500) {
      return {
        type: 'server',
        message: 'Server error while uploading audio. Please retry shortly.',
        statusCode: status,
      };
    }

    return {
      type: 'unknown',
      message: error.message ?? 'Audio upload failed. Please retry.',
      statusCode: status,
    };
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Upload timed out. Please check your connection and retry.',
    };
  }

  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'Audio upload failed.',
  };
}

export function splitFileIntoChunks(file: File, chunkSize: number): Blob[] {
  const chunks: Blob[] = [];

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    chunks.push(file.slice(offset, offset + chunkSize));
  }

  return chunks;
}

async function uploadChunk(params: UploadChunkParams): Promise<void> {
  const {
    token,
    chunk,
    filename,
    chunkIndex,
    totalChunks,
    uploadUuid,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal,
  } = params;

  const chunkFormData = new FormData();
  chunkFormData.append('chunk', chunk, filename);
  chunkFormData.append('filename', filename);
  chunkFormData.append('chunk_index', String(chunkIndex));
  chunkFormData.append('total_chunks', String(totalChunks));
  chunkFormData.append('upload_uuid', uploadUuid);

  const timeoutSignal = signal ? null : createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch('/api/v1/records/upload/chunk', {
      method: 'POST',
      headers: buildAuthHeaders(token),
      body: chunkFormData,
      signal: signal ?? timeoutSignal?.signal,
    });

    if (!response.ok) {
      const error = new Error(
        `Upload chunk failed: ${response.status}`
      ) as Error & { response?: { status?: number } };
      error.response = { status: response.status };
      throw error;
    }
  } finally {
    timeoutSignal?.clear();
  }
}

async function uploadChunkWithRetry(
  params: UploadChunkWithRetryParams
): Promise<void> {
  const {
    maxRetries = MAX_UPLOAD_RETRIES,
    backoffMs = DEFAULT_BACKOFF_MS,
    sleepFn = sleep,
    ...chunkParams
  } = params;

  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await uploadChunk(chunkParams);
      return;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw error;
      }

      const normalizedError = classifyCorpusApiError(error);
      if (normalizedError.type === 'file-size') {
        throw error;
      }

      attempt += 1;
      if (attempt >= maxRetries) {
        throw error;
      }

      const waitMs = backoffMs * Math.pow(2, attempt - 1);
      await sleepFn(waitMs);
    }
  }
}

function buildFinalizeFormData(params: {
  payload: CorpusUploadPayload;
  uploadUuid: string;
  userId: string;
  filename: string;
  totalChunks: number;
}): FormData {
  const { payload, uploadUuid, userId, filename, totalChunks } = params;

  const finalizeForm = new FormData();
  finalizeForm.append('upload_uuid', uploadUuid);
  finalizeForm.append('title', payload.title);
  finalizeForm.append('description', payload.description);
  finalizeForm.append('category_ids', JSON.stringify(payload.categoryIds));
  finalizeForm.append('user_id', userId);
  finalizeForm.append('media_type', DEFAULT_MEDIA_TYPE);
  finalizeForm.append('latitude', String(payload.location.latitude));
  finalizeForm.append('longitude', String(payload.location.longitude));
  finalizeForm.append('use_uid_filename', 'false');
  finalizeForm.append('total_chunks', String(totalChunks));
  finalizeForm.append('filename', filename);
  finalizeForm.append('release_rights', payload.releaseRights);
  finalizeForm.append('language', payload.language);

  return finalizeForm;
}

export async function uploadAudioRecord(
  params: UploadRecordParams
): Promise<void> {
  const {
    token,
    userId,
    payload,
    onChunkProgress,
    onUploadStage,
    onUnauthorized,
    chunkSizeBytes = DEFAULT_CHUNK_SIZE_BYTES,
    maxRetriesPerChunk = MAX_UPLOAD_RETRIES,
    backoffMs = DEFAULT_BACKOFF_MS,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal,
  } = params;

  const uploadUuid = crypto.randomUUID();
  const defaultExtension = payload.audioFile.type.includes('mp4')
    ? 'mp4'
    : 'webm';
  const filename =
    payload.audioFile.name ?? `${uploadUuid}.${defaultExtension}`;
  const chunks = splitFileIntoChunks(payload.audioFile, chunkSizeBytes);
  const totalChunks = chunks.length;

  try {
    onUploadStage?.('uploading');

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      await uploadChunkWithRetry({
        token,
        chunk: chunks[chunkIndex],
        filename,
        chunkIndex,
        totalChunks,
        uploadUuid,
        maxRetries: maxRetriesPerChunk,
        backoffMs,
        timeoutMs,
        signal,
      });

      onChunkProgress?.({
        uploadedChunks: chunkIndex + 1,
        totalChunks,
        percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100),
      });
    }

    onUploadStage?.('finalizing');

    const finalizePayload = buildFinalizeFormData({
      payload,
      uploadUuid,
      userId,
      filename,
      totalChunks,
    });

    const timeoutSignal = createTimeoutSignal(timeoutMs);

    try {
      const response = await fetch('/api/v1/records/upload', {
        method: 'POST',
        headers: buildAuthHeaders(token),
        body: finalizePayload,
        signal: timeoutSignal.signal,
      });

      if (!response.ok) {
        const error = new Error(
          `Finalize upload failed: ${response.status}`
        ) as Error & { response?: { status?: number } };
        error.response = { status: response.status };
        throw error;
      }
    } finally {
      timeoutSignal.clear();
    }
  } catch (error) {
    if (isUnauthorizedError(error)) {
      onUnauthorized?.();
    }

    throw error;
  }
}

export async function fetchCategories(token: string): Promise<Category[]> {
  const response = await fetch('/api/v1/categories/', {
    headers: {
      ...buildAuthHeaders(token),
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter(
      (item: Record<string, unknown>) =>
        item && typeof item === 'object' && item.approved === true
    )
    .map((item: Record<string, unknown>) => ({
      id: getSafeString(item.id),
      name: getSafeString(item.name),
      title:
        typeof item.title === 'string'
          ? item.title
          : typeof item.name === 'string'
            ? item.name
            : getSafeString(item.title),
      description:
        typeof item.description === 'string'
          ? item.description
          : getSafeString(item.description),
      approved: item.approved === true,
    }));
}

function getSafeString(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
    ? String(value)
    : '';
}

export interface LocationInfo {
  formattedAddress: string;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}

export async function verifyLocation(
  token: string,
  latitude: number,
  longitude: number
): Promise<LocationInfo> {
  const response = await fetch('/api/v1/location/verify-location', {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
    throw new Error(`Location verification failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    formattedAddress:
      typeof data.formatted_address === 'string'
        ? data.formatted_address
        : getSafeString(data.formatted_address),
    country: (data.country as string | null) ?? null,
    state: (data.state as string | null) ?? null,
    city: (data.city as string | null) ?? null,
    postalCode: (data.postal_code as string | null) ?? null,
    latitude: Number(data.latitude ?? latitude),
    longitude: Number(data.longitude ?? longitude),
  };
}
