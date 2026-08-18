// Platform registry — single source of truth for every exchange integration.
// Adding a new platform = one entry here + one logo case in PlatformLogo.
// Layouts (account cards, filters, add-account modal) render from this list,
// so new platforms slot in without touching component structure.

import type { Dict } from "./i18n";
import type { BinanceType, Platform } from "./types";

export type LogoKey = "binance" | "wallet" | "bybit" | "gate" | "bitget";

export interface PlatformMeta {
  id: Platform;
  nameKey: keyof Dict;
  brandColor: string;
  logoKey: LogoKey;
  kind: "dex" | "cex";
  status: "supported" | "coming-soon";
  /** for cex platforms: the wallet types this platform reports (drives the type badges + subtotals) */
  balanceTypes?: BinanceType[];
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "okx-dex",
    nameKey: "okxDex",
    brandColor: "#0F9CF3",
    logoKey: "wallet",
    kind: "dex",
    status: "supported",
  },
  {
    id: "binance",
    nameKey: "binance",
    brandColor: "#F0B90B",
    logoKey: "binance",
    kind: "cex",
    status: "supported",
    balanceTypes: ["spot", "funding", "margin", "earn", "futures"],
  },
  {
    id: "gate",
    nameKey: "gate",
    brandColor: "#1E6FFF",
    logoKey: "gate",
    kind: "cex",
    status: "coming-soon",
  },
  {
    id: "bybit",
    nameKey: "bybit",
    brandColor: "#F7C600",
    logoKey: "bybit",
    kind: "cex",
    status: "coming-soon",
  },
  {
    id: "bitget",
    nameKey: "bitget",
    brandColor: "#05EE78",
    logoKey: "bitget",
    kind: "cex",
    status: "coming-soon",
  },
];

export const platformById = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<Platform, PlatformMeta>;

export const supportedPlatforms = PLATFORMS.filter((p) => p.status === "supported");
