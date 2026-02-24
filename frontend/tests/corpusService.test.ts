import { afterEach, expect, test } from "vitest";

import {
  configureCorpusService,
  getAudioRecordUrl,
  getInternAudios,
  searchInternById,
  searchInternsByName,
} from "../src/services/corpus/corpusService.ts";

interface FetchCall {
  url: string;
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
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
    baseUrl: "",
    authToken: "",
    useMock: false,
    fetcher: async () => mockResponse(404, {}),
  });
});

test("searchInternById uses configured base URL/auth header and parses profile payload", async () => {
  const calls: FetchCall[] = [];

  configureCorpusService({
    baseUrl: "https://api.example.test/",
    authToken: "token-123",
    useMock: false,
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return mockResponse(200, {
        data: {
          user_id: "intern_1",
          full_name: "Intern One",
        },
      });
    },
  });

  const profile = await searchInternById(" intern_1 ");

  expect(profile).toEqual({ id: "intern_1", name: "Intern One" });
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe("https://api.example.test/api/v1/users/intern_1");
  expect(calls[0].init?.method).toBe("GET");
  expect(calls[0].init?.headers?.Accept).toBe("application/json");
  expect(calls[0].init?.headers?.Authorization).toBe("Bearer token-123");
});

test("searchInternById falls back to requested id on 404", async () => {
  configureCorpusService({
    fetcher: async () => mockResponse(404, { detail: "Not Found" }),
  });

  const profile = await searchInternById("missing-user");

  expect(profile).toEqual({ id: "missing-user" });
});

test("searchInternsByName returns empty array for blank query without requesting API", async () => {
  let callCount = 0;
  configureCorpusService({
    fetcher: async () => {
      callCount += 1;
      return mockResponse(200, []);
    },
  });

  const results = await searchInternsByName("   ");

  expect(results).toEqual([]);
  expect(callCount).toBe(0);
});

test("getInternAudios extracts normalized audio metadata from mixed payload fields", async () => {
  configureCorpusService({
    fetcher: async () =>
      mockResponse(200, {
        records: [
          {
            record_id: "audio_1",
            category: "standup;daily",
            tags: [{ name: "internship" }],
            created_at: "2026-02-20T10:00:00Z",
            audio_url: "https://cdn.example.test/audio_1.wav",
          },
        ],
      }),
  });

  const audios = await getInternAudios("intern_1");

  expect(audios).toHaveLength(1);
  expect(audios[0].id).toBe("audio_1");
  expect(audios[0].category).toBe("standup");
  expect(audios[0].tag).toBe("internship");
  expect(audios[0].labels).toContain("standup");
  expect(audios[0].labels).toContain("daily");
  expect(audios[0].labels).toContain("internship");
  expect(audios[0].uploadedAt).toBe("2026-02-20T10:00:00.000Z");
  expect(audios[0].audioUrl).toBe("https://cdn.example.test/audio_1.wav");
});

test("getAudioRecordUrl returns URL from nested payload data and ignores blank input", async () => {
  const calls: FetchCall[] = [];

  configureCorpusService({
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return mockResponse(200, {
        data: {
          record_url: "https://cdn.example.test/record_9.wav",
        },
      });
    },
  });

  const blankResult = await getAudioRecordUrl("   ");
  const urlResult = await getAudioRecordUrl("record_9");

  expect(blankResult).toBeUndefined();
  expect(urlResult).toBe("https://cdn.example.test/record_9.wav");
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe("/api/v1/records/record_9/record-url");
});

test("corpus service throws for non-404 API errors", async () => {
  configureCorpusService({
    fetcher: async () => mockResponse(500, { detail: "server error" }),
  });

  await expect(getInternAudios("intern_1")).rejects.toThrow(
    /Corpus API request failed \(500\)/
  );
});

test("mock mode bypasses network calls and returns deterministic values", async () => {
  configureCorpusService({
    useMock: true,
    fetcher: async () => {
      throw new Error("fetcher should not be called in mock mode");
    },
  });

  const profile = await searchInternById("intern_100");
  const audios = await getInternAudios("intern_100");
  const audioUrl = await getAudioRecordUrl("record_100");

  expect(profile).toEqual({ id: "intern_100" });
  expect(audios).toEqual([]);
  expect(audioUrl).toBeUndefined();
});
