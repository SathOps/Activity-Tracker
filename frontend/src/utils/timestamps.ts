const TIMEZONELESS_DATETIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)$/;
const NUMERIC_TIMESTAMP_PATTERN = /^\d+(?:\.\d+)?$/;

export function parseTimestamp(
  value: Date | number | string | undefined
): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : new Date(value.getTime());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = value > 9999999999 ? value : value * 1000;
    const parsed = new Date(milliseconds);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (NUMERIC_TIMESTAMP_PATTERN.test(trimmed)) {
    const numericValue = Number(trimmed);
    return parseTimestamp(numericValue);
  }

  const timezoneLessMatch = TIMEZONELESS_DATETIME_PATTERN.exec(trimmed);
  const normalizedValue = timezoneLessMatch
    ? `${timezoneLessMatch[1]}T${timezoneLessMatch[2]}Z`
    : trimmed;
  const parsed = new Date(normalizedValue);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function toIsoTimestamp(
  value: Date | number | string | undefined
): string | undefined {
  return parseTimestamp(value)?.toISOString();
}
