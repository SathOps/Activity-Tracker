import { getInternAudios } from "../../services/corpus";
import type { InternAudioMetadata } from "../../services/corpus";

export type SubmissionStatus = "COMPLETED" | "PENDING";

export interface StandupVerificationResult {
  internId: string;
  validCount: number;
  status: SubmissionStatus;
  checkedDate?: string;
}

export interface StandupVerificationOptions {
  uploadedOnDate?: string;
}

const TARGET_CATEGORY = "standup";
const TARGET_TAG = "internship";
const DEFAULT_STANDUP_ALIASES = [TARGET_CATEGORY];
const DEFAULT_INTERNSHIP_ALIASES = [TARGET_TAG];
const STANDUP_ALIAS_ENV_KEY = "STANDUP_LABEL_ALIASES";
const INTERNSHIP_ALIAS_ENV_KEY = "INTERNSHIP_LABEL_ALIASES";

export async function verifyStandupSubmission(
  internId: string,
  options: StandupVerificationOptions = {}
): Promise<StandupVerificationResult> {
  const normalizedInternId = normalizeInternId(internId);
  const checkedDate = normalizeFilterDate(options.uploadedOnDate);
  const audios = await getInternAudios(normalizedInternId);

  const validCount = audios.filter((audio) =>
    isValidStandupSubmissionAudio(audio) && matchesUploadedDate(audio, checkedDate)
  ).length;

  return {
    internId: normalizedInternId,
    validCount,
    status: validCount > 0 ? "COMPLETED" : "PENDING",
    checkedDate,
  };
}

export function isValidStandupSubmissionAudio(
  audio: Pick<InternAudioMetadata, "category" | "tag"> &
    Partial<Pick<InternAudioMetadata, "labels">>
): boolean {
  const availableLabels = collectComparableLabels(audio);
  const criteria = resolveSubmissionCriteria();

  return (
    hasAnyLabelMatch(availableLabels, criteria.standupAliases) &&
    hasAnyLabelMatch(availableLabels, criteria.internshipAliases)
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

  const parsedDate = new Date(trimmed);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("uploadedOnDate must be a valid date (recommended: YYYY-MM-DD).");
  }

  return parsedDate.toISOString().slice(0, 10);
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

  return parsedDate.toISOString().slice(0, 10) === expectedDate;
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

function resolveSubmissionCriteria(): {
  standupAliases: Set<string>;
  internshipAliases: Set<string>;
} {
  return {
    standupAliases: buildAliasSet(getEnvValue(STANDUP_ALIAS_ENV_KEY), DEFAULT_STANDUP_ALIASES),
    internshipAliases: buildAliasSet(
      getEnvValue(INTERNSHIP_ALIAS_ENV_KEY),
      DEFAULT_INTERNSHIP_ALIASES
    ),
  };
}

function buildAliasSet(rawAliases: string | undefined, defaults: string[]): Set<string> {
  const aliases = new Set<string>();
  const candidates = [...defaults, ...(rawAliases ? splitCandidateLabel(rawAliases) : [])];

  for (const candidate of candidates) {
    const normalized = normalizeComparableValue(candidate);

    if (normalized) {
      aliases.add(normalized);
    }
  }

  return aliases;
}

function hasAnyLabelMatch(
  availableLabels: Set<string>,
  expectedAliases: Set<string>
): boolean {
  for (const expectedAlias of expectedAliases) {
    if (availableLabels.has(expectedAlias)) {
      return true;
    }
  }

  return false;
}

function getEnvValue(key: string): string | undefined {
  const globalScope = globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return globalScope.process?.env?.[key];
}
