/**
 * Parse a CSV string with header `intern_id,intern_name` into an array of
 * Intern objects.  No external libraries — plain string splitting.
 *
 * Rules:
 * - Header row is skipped
 * - Empty / whitespace-only lines are ignored
 * - Whitespace is trimmed from id and name
 * - Duplicates (by id) are dropped (first occurrence wins)
 * - intern_id is case-sensitive
 */

export interface Intern {
  id: string;
  name: string;
}

export function parseInternsCSV(csvText: string): Intern[] {
  const lines = csvText.split(/\r?\n/);
  const interns: Intern[] = [];
  const seenIds = new Set<string>();

  // Start at index 1 to skip the header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split on the first comma only (name could theoretically contain commas)
    const commaIndex = line.indexOf(',');
    if (commaIndex === -1) continue;

    const id = line.slice(0, commaIndex).trim();
    const name = line.slice(commaIndex + 1).trim();

    if (!id) continue;

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    interns.push({ id, name: name || id });
  }

  return interns;
}
