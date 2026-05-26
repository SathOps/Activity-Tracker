/** Merge Tailwind class names (like clsx). */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format a number with commas. */
export function fmt(n: number | undefined | null): string {
  if (n == null) return '—';
  return n.toLocaleString();
}

/** Truncate a string to max length. */
export function truncate(s: string, max = 60): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/** Get today's ISO date string. */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Convert score to colour class. */
export function scoreColour(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

/** Convert score to bg colour class for badges. */
export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

/** Rank medal emoji for top 3. */
export function rankMedal(rank: number): string {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
}

export function toDisplayText(value: unknown): string {
  if (value == null) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}
