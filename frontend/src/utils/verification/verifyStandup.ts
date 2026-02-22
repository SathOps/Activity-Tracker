import { getInternAudios } from "../../services/corpus";
import type { InternAudioMetadata } from "../../services/corpus";

export type SubmissionStatus = "COMPLETED" | "PENDING";

export interface StandupVerificationResult {
  internId: string;
  validCount: number;
  status: SubmissionStatus;
  checkedDate?: string;
  audios?: InternAudioMetadata[];
}

export interface StandupVerificationOptions {
  uploadedOnDate?: string;
  standupAliases?: string | string[];
  internshipAliases?: string | string[];
}

interface SubmissionCriteria {
  standupAliases: Set<string>;
  internshipAliases: Set<string>;
}

const TARGET_CATEGORY = "standup";
const TARGET_TAG = "internship";
const DEFAULT_STANDUP_ALIASES = [TARGET_CATEGORY];
const DEFAULT_INTERNSHIP_ALIASES = [TARGET_TAG];
const STANDUP_ALIAS_ENV_KEY = "STANDUP_LABEL_ALIASES";
const INTERNSHIP_ALIAS_ENV_KEY = "INTERNSHIP_LABEL_ALIASES";
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export async function verifyStandupSubmission(
  internId: string,
  options: StandupVerificationOptions = {}
): Promise<StandupVerificationResult> {
  const normalizedInternId = normalizeInternId(internId);
  const checkedDate = normalizeFilterDate(options.uploadedOnDate);
  const criteria = resolveSubmissionCriteria(options);
  const audios = await getInternAudios(normalizedInternId);

  const validAudios = audios.filter(
    (audio) =>
      isValidStandupSubmissionAudio(audio, criteria) && matchesUploadedDate(audio, checkedDate)
  );
  const validCount = validAudios.length;

  return {
    internId: normalizedInternId,
    validCount,
    status: validCount > 0 ? "COMPLETED" : "PENDING",
    checkedDate,
    audios: validAudios,
  };
}

export function isValidStandupSubmissionAudio(
  audio: Pick<InternAudioMetadata, "category" | "tag"> &
    Partial<Pick<InternAudioMetadata, "labels">>,
  criteriaOverride?: SubmissionCriteria
): boolean {
  const availableLabels = collectComparableLabels(audio);
  const criteria = criteriaOverride ?? resolveSubmissionCriteria();

  return hasDistinctCriteriaMatch(
    availableLabels,
    criteria.standupAliases,
    criteria.internshipAliases
  );
}

function normalizeInternId(internId: string): string {
  const normalizedInternId = internId.trim();

  if (!normalizedInternId) {
    throw new Error("internId is required");
  }

  return normalizedInternId;
}

function normalizeFilterDate(rawDate: string | undefined): string | undefined {
  if (!rawDate) {
    return undefined;
  }

  const trimmed = rawDate.trim();

  if (!trimmed) {
    return undefined;
  }

  const dateKeyMatch = DATE_KEY_PATTERN.exec(trimmed);

  if (dateKeyMatch) {
    const [, yearToken, monthToken, dayToken] = dateKeyMatch;
    const year = Number(yearToken);
    const month = Number(monthToken);
    const day = Number(dayToken);
    const localDate = new Date(year, month - 1, day);

    if (
      localDate.getFullYear() !== year ||
      localDate.getMonth() + 1 !== month ||
      localDate.getDate() !== day
    ) {
      throw new Error("uploadedOnDate must be a valid date (recommended: YYYY-MM-DD).");
    }

    return `${yearToken}-${monthToken}-${dayToken}`;
  }

  const parsedDate = new Date(trimmed);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("uploadedOnDate must be a valid date (recommended: YYYY-MM-DD).");
  }

  return toLocalDateKey(parsedDate);
}

function matchesUploadedDate(
  audio: Pick<InternAudioMetadata, "uploadedAt">,
  expectedDate: string | undefined
): boolean {
  if (!expectedDate) {
    return true;
  }

  if (!audio.uploadedAt) {
    return false;
  }

  const parsedDate = new Date(audio.uploadedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return toLocalDateKey(parsedDate) === expectedDate;
}

function normalizeComparableValue(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function collectComparableLabels(
  audio: Pick<InternAudioMetadata, "category" | "tag"> &
    Partial<Pick<InternAudioMetadata, "labels">>
): Set<string> {
  const candidates = [audio.category, audio.tag, ...(audio.labels ?? [])];
  const labels = new Set<string>();

  for (const candidate of candidates) {
    for (const token of splitCandidateLabel(candidate)) {
      const normalized = normalizeComparableValue(token);

      if (normalized) {
        labels.add(normalized);
      }
    }
  }

  return labels;
}

function splitCandidateLabel(value: string): string[] {
  return value
    .split(/[|,;/]+/g)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function resolveSubmissionCriteria(
  options: Pick<StandupVerificationOptions, "standupAliases" | "internshipAliases"> = {}
): SubmissionCriteria {
  return {
    standupAliases: buildAliasSet(DEFAULT_STANDUP_ALIASES, [
      getEnvValue(STANDUP_ALIAS_ENV_KEY),
      options.standupAliases,
    ]),
    internshipAliases: buildAliasSet(DEFAULT_INTERNSHIP_ALIASES, [
      getEnvValue(INTERNSHIP_ALIAS_ENV_KEY),
      options.internshipAliases,
    ]),
  };
}

function buildAliasSet(
  defaults: string[],
  sources: Array<string | string[] | undefined>
): Set<string> {
  const aliases = new Set<string>();
  const candidates = [...defaults];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const value of source) {
        candidates.push(...splitCandidateLabel(value));
      }
      continue;
    }

    candidates.push(...splitCandidateLabel(source));
  }

  for (const candidate of candidates) {
    const normalized = normalizeComparableValue(candidate);

    if (normalized) {
      aliases.add(normalized);
    }
  }

  return aliases;
}

function hasDistinctCriteriaMatch(
  availableLabels: Set<string>,
  standupAliases: Set<string>,
  internshipAliases: Set<string>
): boolean {
  const matchedStandupAliases = getMatchedAliases(availableLabels, standupAliases);
  const matchedInternshipAliases = getMatchedAliases(availableLabels, internshipAliases);

  if (matchedStandupAliases.length === 0 || matchedInternshipAliases.length === 0) {
    return false;
  }

  for (const standupAlias of matchedStandupAliases) {
    for (const internshipAlias of matchedInternshipAliases) {
      if (standupAlias !== internshipAlias) {
        return true;
      }
    }
  }

  return false;
}

function getMatchedAliases(
  availableLabels: Set<string>,
  expectedAliases: Set<string>
): string[] {
  const matchedAliases: string[] = [];

  for (const expectedAlias of expectedAliases) {
    if (availableLabels.has(expectedAlias)) {
      matchedAliases.push(expectedAlias);
    }
  }

  return matchedAliases;
}

function getEnvValue(key: string): string | undefined {
  const globalScope = globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return globalScope.process?.env?.[key];
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
