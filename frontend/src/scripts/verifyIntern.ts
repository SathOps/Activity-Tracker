import {
  configureCorpusService,
  getInternAudios,
  searchInternById,
} from "../services/corpus";
import {
  isValidStandupSubmissionAudio,
  verifyStandupSubmission,
} from "../utils/verification";

interface ProcessLike {
  env: Record<string, string | undefined>;
  argv: string[];
  exit(code?: number): never;
}

const runtimeProcess = resolveRuntimeProcess();

async function main(): Promise<void> {
  const internId = resolveInternId();
  const uploadedOnDate = resolveUploadedOnDate();

  configureCorpusService({
    baseUrl: runtimeProcess.env.SWECHA_API_BASE_URL,
    authToken: runtimeProcess.env.CORPUS_TOKEN,
    useMock: false,
  });

  const profile = await searchInternById(internId);
  const audios = await getInternAudios(internId);
  const verification = await verifyStandupSubmission(internId, { uploadedOnDate });

  console.log("Profile:", profile);
  console.log("Total audios:", audios.length);
  console.log("Verification:", verification);

  if (audios.length > 0 && verification.validCount === 0) {
    console.log(
      "Debug: no audio matched both required labels (`stand-up` + `internship`)."
    );
    console.table(
      audios.map((audio) => ({
        id: audio.id,
        category: audio.category,
        tag: audio.tag,
        labels: (audio.labels ?? []).join(" | "),
        uploadedAt: audio.uploadedAt ?? "",
        categoryMatched: isValidStandupSubmissionAudio(audio),
        dateMatched: verification.checkedDate
          ? isUploadedOnDate(audio.uploadedAt, verification.checkedDate)
          : true,
      }))
    );
    console.log(
      "Tip: if backend returns category IDs, set STANDUP_LABEL_ALIASES and INTERNSHIP_LABEL_ALIASES in .env (comma-separated names/ids)."
    );
    console.table(
      summarizeLabelFrequency(audios).map(([label, count]) => ({
        label,
        count,
      }))
    );
  }
}

function resolveInternId(): string {
  const cliInternId = runtimeProcess.argv[2]?.trim();
  const envInternId = runtimeProcess.env.INTERN_ID?.trim();
  const internId = cliInternId || envInternId;

  if (!internId) {
    throw new Error(
      "Provide an intern ID as CLI arg (`npm run verify:intern -- <id>`) or set INTERN_ID in .env"
    );
  }

  return internId;
}

function resolveUploadedOnDate(): string | undefined {
  const cliDate = runtimeProcess.argv[3]?.trim();
  const envDate = runtimeProcess.env.VERIFY_DATE?.trim();
  const uploadedOnDate = cliDate || envDate;

  if (!uploadedOnDate) {
    return undefined;
  }

  return uploadedOnDate;
}

function summarizeLabelFrequency(
  audios: Array<{
    category: string;
    tag: string;
    labels?: string[];
    uploadedAt?: string;
  }>
): Array<[string, number]> {
  const frequencies = new Map<string, number>();

  for (const audio of audios) {
    const values = [audio.category, audio.tag, ...(audio.labels ?? [])];

    for (const value of values) {
      const normalized = value.trim();

      if (!normalized) {
        continue;
      }

      frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
    }
  }

  return Array.from(frequencies.entries()).sort((left, right) => right[1] - left[1]);
}

function isUploadedOnDate(
  uploadedAt: string | undefined,
  expectedDate: string
): boolean {
  if (!uploadedAt) {
    return false;
  }

  const parsedDate = new Date(uploadedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().slice(0, 10) === expectedDate;
}

function resolveRuntimeProcess(): ProcessLike {
  const globalScope = globalThis as {
    process?: ProcessLike;
  };

  if (!globalScope.process) {
    throw new Error("verifyIntern script must run in a Node.js runtime.");
  }

  return globalScope.process;
}

main().catch((error: unknown) => {
  console.error(error);
  runtimeProcess.exit(1);
});
