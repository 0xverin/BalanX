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
