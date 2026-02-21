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
const REQUIRED_STANDUP_COUNT = 4;

export async function verifyStandupSubmission(
  internId: string
): Promise<StandupVerificationResult> {
  const normalizedInternId = normalizeInternId(internId);
  const audios = await getInternAudios(normalizedInternId);

  const validCount = audios.filter(isValidStandupSubmissionAudio).length;

  return {
    internId: normalizedInternId,
    validCount,
    status: validCount >= REQUIRED_STANDUP_COUNT ? "COMPLETED" : "PENDING",
  };
}

export function isValidStandupSubmissionAudio(
  audio: Pick<InternAudioMetadata, "category" | "tag">
): boolean {
  return (
    normalizeValue(audio.category) === TARGET_CATEGORY &&
    normalizeValue(audio.tag) === TARGET_TAG
  );
}

function normalizeInternId(internId: string): string {
  const normalizedInternId = internId.trim();

  if (!normalizedInternId) {
    throw new Error("internId is required");
  }

  return normalizedInternId;
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}
