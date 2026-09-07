// Shared formatting helpers (pure, locale-aware).

import type { Dict, Lang } from "./i18n";

/** "just now" / "N min ago" / local time — used by overview and account cards. */
export function formatRelative(
  iso: string,
  now: number,
  lang: Lang,
  t: Dict
): string {
  const ms = now - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return t.justNow;
  if (min < 60) return t.agoMin(min);
  return new Date(iso).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Short chain label for display (ETH / BSC). */
export function chainShortLabel(chain: "eth" | "bsc"): string {
  return chain === "eth" ? "ETH" : "BSC";
}

/**
 * UTC+8 wall-clock timestamp "YYYY-MM-DD HH:mm" — snapshot labels are
 * UTC+8-centric (the whole product's day boundary is UTC+8 midnight).
 */
export function formatUtc8DateTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(
    d.getUTCHours()
  )}:${p(d.getUTCMinutes())}`;
}

/**
 * Minute-precise label for a snapshot: the recorded moment when known, else
 * the date's UTC+8 midnight — auto snapshots ARE recorded at 24:00, so this
 * is exact for them and the best approximation for pre-`at` exports.
 */
export function formatSnapshotTime(date: string, at?: string): string {
  return at ? formatUtc8DateTime(at) : `${date} 00:00`;
}
