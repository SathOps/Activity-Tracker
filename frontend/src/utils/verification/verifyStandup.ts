import { getInternAudios } from "../../services/corpus";
import type { InternAudioMetadata } from "../../services/corpus";

export type SubmissionStatus = "COMPLETED" | "PENDING";

export interface StandupVerificationResult {
  internId: string;
  validCount: number;
  status: SubmissionStatus;
}

const TARGET_CATEGORY = "standup";
const TARGET_TAG = "internship";
const DEFAULT_STANDUP_ALIASES = [TARGET_CATEGORY];
const DEFAULT_INTERNSHIP_ALIASES = [TARGET_TAG];
const STANDUP_ALIAS_ENV_KEY = "STANDUP_LABEL_ALIASES";
const INTERNSHIP_ALIAS_ENV_KEY = "INTERNSHIP_LABEL_ALIASES";

export async function verifyStandupSubmission(
  internId: string
): Promise<StandupVerificationResult> {
  const normalizedInternId = normalizeInternId(internId);
  const audios = await getInternAudios(normalizedInternId);

  const validCount = audios.filter(isValidStandupSubmissionAudio).length;

  return {
    internId: normalizedInternId,
    validCount,
    status: validCount > 0 ? "COMPLETED" : "PENDING",
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
    standupAliases: buildAliasSet(
      process.env[STANDUP_ALIAS_ENV_KEY],
      DEFAULT_STANDUP_ALIASES
    ),
    internshipAliases: buildAliasSet(
      process.env[INTERNSHIP_ALIAS_ENV_KEY],
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
