import { expect, test } from "vitest";

import { parseInternsCSV } from "../src/utils/parseInternsCSV.ts";

test("parseInternsCSV trims values, skips invalid rows, and de-duplicates by intern id", () => {
  const csv = [
    "intern_id,intern_name",
    "  intern_1  ,  Alice  ",
    "intern_2,",
    "intern_1,Duplicate Alice",
    ",No ID",
    "not-a-csv-line",
    "   ",
  ].join("\n");

  const interns = parseInternsCSV(csv);

  expect(interns).toEqual([
    { id: "intern_1", name: "Alice" },
    { id: "intern_2", name: "intern_2" },
  ]);
});

test("parseInternsCSV returns empty list for header-only CSV", () => {
  const interns = parseInternsCSV("intern_id,intern_name\n");

  expect(interns).toEqual([]);
});
