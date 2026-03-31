import { toIsoTimestamp } from '../../utils/timestamps';

export interface InternSummary {
  id: string;
  name?: string;
}

export interface InternAudioMetadata {
  id: string;
  category: string;
  tag: string;
  labels?: string[];
  uploadedAt?: string;
  audioUrl?: string;
}

interface FetchRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cache?:
    | 'default'
    | 'force-cache'
    | 'no-cache'
    | 'no-store'
    | 'only-if-cached'
    | 'reload';
}

interface FetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init?: FetchRequestInit
) => Promise<FetchResponse>;

export interface CorpusServiceConfig {
  baseUrl?: string;
  authToken?: string;
  useMock?: boolean;
  fetcher?: FetchLike | null;
}

interface RuntimeConfig {
  baseUrl: string;
  authToken: string;
  useMock: boolean;
  fetcher?: FetchLike;
}

type UnknownRecord = Record<string, unknown>;

const runtimeConfig: RuntimeConfig = {
  baseUrl: '',
  authToken: '',
  useMock: false,
  fetcher: resolveGlobalFetch(),
};

export function configureCorpusService(config: CorpusServiceConfig = {}): void {
  if (typeof config.baseUrl === 'string') {
    runtimeConfig.baseUrl = config.baseUrl.trim();
  }

  if (typeof config.authToken === 'string') {
    runtimeConfig.authToken = config.authToken;
  }

  if (typeof config.useMock === 'boolean') {
    runtimeConfig.useMock = config.useMock;
  }

  if ('fetcher' in config) {
    runtimeConfig.fetcher =
      typeof config.fetcher === 'function' ? config.fetcher : undefined;
  }
}

export async function searchInternById(
  internId: string
): Promise<InternSummary> {
  const normalizedInternId = normalizeInternId(internId);

  if (runtimeConfig.useMock) {
    return getMockIntern(normalizedInternId);
  }

  const payload = await requestCorpusApi(
    `/api/v1/users/${encodeURIComponent(normalizedInternId)}`
  );

  if (!payload) {
    return { id: normalizedInternId };
  }

  return parseInternSummary(payload, normalizedInternId);
}

export async function searchInternsByName(
  query: string
): Promise<InternSummary[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  if (runtimeConfig.useMock) {
    return getMockInternsByName(trimmed);
  }

  const payload = await requestCorpusApi(
    `/api/v1/users/search?query=${encodeURIComponent(trimmed)}`
  );

  if (!payload) {
    return [];
  }

  return parseInternList(payload);
}

export async function getInternAudios(
  internId: string
): Promise<InternAudioMetadata[]> {
  const normalizedInternId = normalizeInternId(internId);

  if (runtimeConfig.useMock) {
    return getMockAudios(normalizedInternId);
  }

  const payload = await requestCorpusApi(
    `/api/v1/users/${encodeURIComponent(normalizedInternId)}/contributions/audio`
  );

  if (!payload) {
    return [];
  }

  return extractAudioItems(payload);
}

export async function getAudioRecordUrl(
  recordId: string
): Promise<string | undefined> {
  const normalizedRecordId = recordId.trim();

  if (!normalizedRecordId) {
    return undefined;
  }

  if (runtimeConfig.useMock) {
    return undefined;
  }

  const payload = await requestCorpusApi(
    `/api/v1/records/${encodeURIComponent(normalizedRecordId)}/record-url`
  );

  if (!payload || !isRecord(payload)) {
    return undefined;
  }

  return (
    pickString(payload, ['audio_url', 'file_url', 'record_url', 'url']) ||
    (isRecord(payload.data)
      ? pickString(payload.data, ['audio_url', 'file_url', 'record_url', 'url'])
      : undefined)
  );
}

function resolveGlobalFetch(): FetchLike | undefined {
  const globalScope = globalThis as { fetch?: unknown };

  if (typeof globalScope.fetch !== 'function') {
    return undefined;
  }

  return globalScope.fetch as FetchLike;
}

function normalizeInternId(internId: string): string {
  const normalizedInternId = internId.trim();

  if (!normalizedInternId) {
    throw new Error('internId is required');
  }

  return normalizedInternId;
}

function getMockIntern(internId: string): InternSummary {
  return { id: internId };
}

function getMockInternsByName(_query: string): InternSummary[] {
  return [];
}

function parseInternList(payload: unknown): InternSummary[] {
  const items = resolveArray(payload);

  return items
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      return parseInternSummary(item, '');
    })
    .filter((item): item is InternSummary => item !== null && item.id !== '');
}

function getMockAudios(_internId: string): InternAudioMetadata[] {
  return [];
}

async function requestCorpusApi(path: string): Promise<unknown> {
  const fetcher = runtimeConfig.fetcher;
  const baseUrl = trimTrailingSlash(runtimeConfig.baseUrl);

  if (!fetcher) {
    return undefined;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  headers['Cache-Control'] = 'no-cache';
  headers.Pragma = 'no-cache';

  if (runtimeConfig.authToken) {
    headers.Authorization = `Bearer ${runtimeConfig.authToken}`;
  }

  const requestUrl = baseUrl ? `${baseUrl}${path}` : path;
  const response = await fetcher(requestUrl, {
    cache: 'no-store',
    method: 'GET',
    headers,
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(
      `Corpus API request failed (${response.status}) for endpoint: ${path}`
    );
  }

  return response.json();
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseInternSummary(
  payload: unknown,
  fallbackId: string
): InternSummary {
  const primaryObject = resolvePrimaryObject(payload);

  if (!primaryObject) {
    return { id: fallbackId };
  }

  const id =
    pickString(primaryObject, ['id', '_id', 'user_id', 'userId']) ?? fallbackId;

  const name = pickString(primaryObject, [
    'name',
    'full_name',
    'fullName',
    'display_name',
    'displayName',
    'username',
  ]);

  if (!name) {
    return { id };
  }

  return { id, name };
}

function extractAudioItems(payload: unknown): InternAudioMetadata[] {
  const items = resolveArray(payload);

  return items
    .map((item, index) => parseAudioItem(item, index))
    .filter((item): item is InternAudioMetadata => item !== null);
}

function parseAudioItem(
  item: unknown,
  index: number
): InternAudioMetadata | null {
  if (!isRecord(item)) {
    return null;
  }

  const id =
    pickString(item, ['id', '_id', 'record_id', 'recordId', 'uuid']) ??
    `audio-${index + 1}`;

  const categoryValues = extractFieldTextValues(item, [
    'category',
    'categories',
  ]);
  const tagValues = extractFieldTextValues(item, [
    'tag',
    'tags',
    'domain',
    'domains',
    'label',
    'labels',
  ]);
  const contextualValues = extractTextValuesByKeyPattern(
    item,
    /(category|categories|tag|tags|domain|domains|label|labels)/i
  );
  const labels = uniqueNonEmptyStrings([
    ...categoryValues,
    ...tagValues,
    ...contextualValues,
  ]);
  const uploadedAt = parseUploadedAt(item);
  const audioUrl = pickString(item, [
    'audio_url',
    'file_url',
    'record_url',
    'url',
    'audioUrl',
    'fileUrl',
    'recordUrl',
  ]);

  return {
    id,
    category: categoryValues[0] ?? '',
    tag: tagValues[0] ?? '',
    labels,
    uploadedAt,
    audioUrl,
  };
}

function extractFieldTextValues(
  source: UnknownRecord,
  keys: readonly string[]
): string[] {
  const values: string[] = [];

  for (const key of keys) {
    values.push(...parseTextValues(source[key]));
  }

  return uniqueNonEmptyStrings(values);
}

function parseTextValues(value: unknown, depth = 0): string[] {
  if (depth > 6 || value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    return splitLabelText(value);
  }

  if (Array.isArray(value)) {
    return uniqueNonEmptyStrings(
      value.flatMap((entry) => parseTextValues(entry, depth + 1))
    );
  }

  if (isRecord(value)) {
    const directValues = pickStrings(value, [
      'name',
      'slug',
      'title',
      'value',
      'label',
    ]).flatMap(splitLabelText);

    if (directValues.length > 0) {
      return uniqueNonEmptyStrings(directValues);
    }

    return uniqueNonEmptyStrings(
      Object.values(value).flatMap((entry) => parseTextValues(entry, depth + 1))
    );
  }

  return [];
}

function extractTextValuesByKeyPattern(
  value: unknown,
  keyPattern: RegExp,
  depth = 0
): string[] {
  if (depth > 6 || value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return uniqueNonEmptyStrings(
      value.flatMap((item) =>
        extractTextValuesByKeyPattern(item, keyPattern, depth + 1)
      )
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  const collectedValues: string[] = [];

  for (const [key, itemValue] of Object.entries(value)) {
    if (keyPattern.test(key)) {
      collectedValues.push(...parseTextValues(itemValue, depth + 1));
    }

    if (isRecord(itemValue) || Array.isArray(itemValue)) {
      collectedValues.push(
        ...extractTextValuesByKeyPattern(itemValue, keyPattern, depth + 1)
      );
    }
  }

  return uniqueNonEmptyStrings(collectedValues);
}

function parseUploadedAt(source: UnknownRecord): string | undefined {
  const directFieldCandidates = [
    source.uploaded_at,
    source.uploadedAt,
    source.created_at,
    source.createdAt,
    source.submitted_at,
    source.submittedAt,
    source.recorded_at,
    source.recordedAt,
    source.date,
    source.datetime,
    source.timestamp,
  ];

  for (const candidate of directFieldCandidates) {
    const resolved = resolveDateCandidate(candidate);

    if (resolved) {
      return resolved;
    }
  }

  const nestedDateCandidates = extractTextValuesByKeyPattern(
    source,
    /(uploaded|created|submitted|recorded|timestamp|date|datetime)/i
  );

  for (const candidate of nestedDateCandidates) {
    const resolved = resolveDateCandidate(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}

function resolveDateCandidate(value: unknown): string | undefined {
  if (
    (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' && value.trim())
  ) {
    return toIsoTimestamp(value);
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const nestedValues = [
    value.date,
    value.datetime,
    value.timestamp,
    value.created_at,
    value.createdAt,
    value.uploaded_at,
    value.uploadedAt,
    value.submitted_at,
    value.submittedAt,
    value.value,
  ];

  for (const nestedValue of nestedValues) {
    const resolved = resolveDateCandidate(nestedValue);

    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}

function splitLabelText(value: string): string[] {
  const cleaned = value.trim();

  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(/[|,;/]+/g)
    .map((part) => {
      const trimmedPart = part.trim();

      return (
        trimmedPart
          // oxlint-disable-next-line no-useless-escape
          .replace(/^[\[\(\{'"`]+/, '')
          // oxlint-disable-next-line no-useless-escape
          .replace(/[\]\)\}'"`]+$/, '')
          .trim()
      );
    })
    .filter((part) => part.length > 0);
}

function uniqueNonEmptyStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length))
  );
}

function resolveArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const directCandidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.records,
    payload.contributions,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  for (const candidate of directCandidates) {
    if (!isRecord(candidate)) {
      continue;
    }

    const nestedCandidates = [
      candidate.items,
      candidate.results,
      candidate.records,
      candidate.contributions,
      candidate.data,
      candidate.audio,
    ];

    for (const nested of nestedCandidates) {
      if (Array.isArray(nested)) {
        return nested;
      }
    }
  }

  return [];
}

function resolvePrimaryObject(payload: unknown): UnknownRecord | null {
  if (isRecord(payload)) {
    if (isRecord(payload.data)) {
      return payload.data;
    }

    return payload;
  }

  return null;
}

function pickString(
  source: UnknownRecord,
  keys: readonly string[]
): string | undefined {
  const values = pickStrings(source, keys);

  return values[0];
}

function pickStrings(source: UnknownRecord, keys: readonly string[]): string[] {
  const values: string[] = [];

  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim()) {
      values.push(value.trim());
    }
  }

  return values;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}
