/** Delay (ms) until the next 00:00 in UTC+8 — the daily snapshot time. */
export function msUntilNextUtc8Midnight(now: Date): number {
  const utc8 = new Date(now.getTime() + 8 * 3600_000);
  const next = Date.UTC(utc8.getUTCFullYear(), utc8.getUTCMonth(), utc8.getUTCDate() + 1);
  return next - utc8.getTime();
}

/** The calendar date (YYYY-MM-DD) in UTC+8 — snapshot labels must use this, not UTC. */
export function utc8Date(now: Date): string {
  const utc8 = new Date(now.getTime() + 8 * 3600_000);
  return utc8.toISOString().slice(0, 10);
}
