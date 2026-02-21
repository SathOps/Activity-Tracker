export interface InternSummary {
  id: string;
  name?: string;
}

export interface InternAudioMetadata {
  id: string;
  category: string;
  tag: string;
  labels?: string[];
}

interface FetchRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
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
  fetcher?: FetchLike;
}

interface RuntimeConfig {
  baseUrl: string;
  authToken: string;
  useMock: boolean;
  fetcher?: FetchLike;
}

type UnknownRecord = Record<string, unknown>;

const runtimeConfig: RuntimeConfig = {
  baseUrl: "",
  authToken: "",
  useMock: true,
  fetcher: resolveGlobalFetch(),
};

const mockInternById: Record<string, InternSummary> = {
  INT001: { id: "INT001", name: "Aarav Reddy" },
  INT002: { id: "INT002", name: "Saanvi Nair" },
  INT003: { id: "INT003", name: "Vihaan Kumar" },
};

const mockAudiosByInternId: Record<string, InternAudioMetadata[]> = {
  INT001: [
    { id: "rec-101", category: "standup", tag: "internship" },
    { id: "rec-102", category: "standup", tag: "internship" },
    { id: "rec-103", category: "standup", tag: "internship" },
    { id: "rec-104", category: "standup", tag: "internship" },
    { id: "rec-105", category: "read", tag: "internship" },
  ],
  INT002: [
    { id: "rec-201", category: "standup", tag: "internship" },
    { id: "rec-202", category: "standup", tag: "internship" },
    { id: "rec-203", category: "standup", tag: "general" },
  ],
  INT003: [
    { id: "rec-301", category: "standup", tag: "internship" },
    { id: "rec-302", category: "pronunciation", tag: "internship" },
  ],
};

export function configureCorpusService(config: CorpusServiceConfig = {}): void {
  if (typeof config.baseUrl === "string") {
    runtimeConfig.baseUrl = config.baseUrl.trim();
  }

  if (typeof config.authToken === "string") {
    runtimeConfig.authToken = config.authToken;
  }

  if (typeof config.useMock === "boolean") {
    runtimeConfig.useMock = config.useMock;
  }

  if (typeof config.fetcher === "function") {
    runtimeConfig.fetcher = config.fetcher;
  }
}

export async function searchInternById(internId: string): Promise<InternSummary> {
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

function resolveGlobalFetch(): FetchLike | undefined {
  const globalScope = globalThis as { fetch?: unknown };

  if (typeof globalScope.fetch !== "function") {
    return undefined;
  }

  return globalScope.fetch as FetchLike;
}

function normalizeInternId(internId: string): string {
  const normalizedInternId = internId.trim();

  if (!normalizedInternId) {
    throw new Error("internId is required");
  }

  return normalizedInternId;
}

function getMockIntern(internId: string): InternSummary {
  return mockInternById[internId.toUpperCase()] ?? { id: internId };
}

function getMockAudios(internId: string): InternAudioMetadata[] {
  const audios = mockAudiosByInternId[internId.toUpperCase()] ?? [];

  return audios.map((audio) => ({ ...audio }));
}

async function requestCorpusApi(path: string): Promise<unknown | undefined> {
  const fetcher = runtimeConfig.fetcher;
  const baseUrl = trimTrailingSlash(runtimeConfig.baseUrl);

  if (!fetcher || !baseUrl) {
    return undefined;
  }

  const headers: Record<string, string> = { Accept: "application/json" };

  if (runtimeConfig.authToken) {
    headers.Authorization = `Bearer ${runtimeConfig.authToken}`;
  }

  const response = await fetcher(`${baseUrl}${path}`, {
    method: "GET",
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
  return value.replace(/\/+$/, "");
}

function parseInternSummary(payload: unknown, fallbackId: string): InternSummary {
  const primaryObject = resolvePrimaryObject(payload);

  if (!primaryObject) {
    return { id: fallbackId };
  }

  const id =
    pickString(primaryObject, ["id", "_id", "user_id", "userId"]) ?? fallbackId;

  const name = pickString(primaryObject, [
    "name",
    "full_name",
    "fullName",
    "display_name",
    "displayName",
    "username",
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
    pickString(item, ["id", "_id", "record_id", "recordId", "uuid"]) ??
    `audio-${index + 1}`;

  const categoryValues = extractFieldTextValues(item, ["category", "categories"]);
  const tagValues = extractFieldTextValues(item, [
    "tag",
    "tags",
    "domain",
    "domains",
    "label",
    "labels",
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

  return {
    id,
    category: categoryValues[0] ?? "",
    tag: tagValues[0] ?? "",
    labels,
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

  if (typeof value === "string") {
    return splitLabelText(value);
  }

  if (Array.isArray(value)) {
    return uniqueNonEmptyStrings(
      value.flatMap((entry) => parseTextValues(entry, depth + 1))
    );
  }

  if (isRecord(value)) {
    const directValues = pickStrings(value, [
      "name",
      "slug",
      "title",
      "value",
      "label",
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

function splitLabelText(value: string): string[] {
  const cleaned = value.trim();

  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(/[|,;/]+/g)
    .map((part) =>
      part
        .replace(/^[\[\(\{'"`]+/, "")
        .replace(/[\]\)\}'"`]+$/, "")
        .trim()
    )
    .filter((part) => part.length > 0);
}

function uniqueNonEmptyStrings(values: readonly string[]): string[] {
  const uniqueValues = new Set<string>();

  for (const value of values) {
    const normalized = value.trim();

    if (!normalized) {
      continue;
    }

    uniqueValues.add(normalized);
  }

  return Array.from(uniqueValues);
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

    if (typeof value === "string" && value.trim()) {
      values.push(value.trim());
    }
  }

  return values;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
