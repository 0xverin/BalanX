// Platform registry — single source of truth for every exchange integration.
// Adding a platform = one entry here + one logo case + one adapter.
// The add-account form, account cards, filters and dispatcher all render from
// this list (spec: user story 31 — registry-driven).

import type { Dict } from "./i18n";
import type { BalanceCategory, Platform } from "./types";

export type LogoKey =
  | "wallet"
  | "okx"
  | "binance"
  | "bybit"
  | "gate"
  | "bitget"
  | "kucoin"
  | "aster"
  | "hyperliquid";

export interface PlatformMeta {
  id: Platform;
  nameKey: keyof Dict;
  brandColor: string;
  logoKey: LogoKey;
  kind: "dex" | "cex";
  status: "supported" | "coming-soon";
  /** which credential fields the add-account form shows; [] = address-based */
  credentialFields: Array<"apiKey" | "secretKey" | "passphrase">;
  /** form shows the wallet-address input (OKX Dex also shows chain selection) */
  needsAddress: boolean;
  /** balance categories this platform reports (drives subtotals) */
  balanceTypes: BalanceCategory[];
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: "okx-dex",
    nameKey: "okxDex",
    brandColor: "#0F9CF3",
    logoKey: "wallet",
    kind: "dex",
    status: "supported",
    credentialFields: [],
    needsAddress: true,
    balanceTypes: [], // token-level detail, no subtotals
  },
  {
    id: "hyperliquid",
    nameKey: "hyperliquid",
    brandColor: "#50D2C1",
    logoKey: "hyperliquid",
    kind: "dex",
    status: "supported",
    credentialFields: [],
    needsAddress: true,
    balanceTypes: ["spot", "perps"],
  },
  {
    id: "okx-cex",
    nameKey: "okxCex",
    brandColor: "#0F9CF3",
    logoKey: "okx",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey", "passphrase"],
    needsAddress: false,
    balanceTypes: ["spot", "funding", "futures"],
  },
  {
    id: "binance",
    nameKey: "binance",
    brandColor: "#F0B90B",
    logoKey: "binance",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey"],
    needsAddress: false,
    balanceTypes: ["spot", "funding", "margin", "earn", "futures"],
  },
  {
    id: "bybit",
    nameKey: "bybit",
    brandColor: "#F6A500",
    logoKey: "bybit",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey"],
    needsAddress: false,
    balanceTypes: ["unified", "funding"],
  },
  {
    id: "gate",
    nameKey: "gate",
    brandColor: "#2354E6",
    logoKey: "gate",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey"],
    needsAddress: false,
    balanceTypes: ["spot", "spot-margin", "futures", "delivery"],
  },
  {
    id: "bitget",
    nameKey: "bitget",
    brandColor: "#00F0FF",
    logoKey: "bitget",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey", "passphrase"],
    needsAddress: false,
    balanceTypes: ["spot", "futures"],
  },
  {
    id: "kucoin",
    nameKey: "kucoin",
    brandColor: "#23AF91",
    logoKey: "kucoin",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey", "passphrase"],
    needsAddress: false,
    balanceTypes: ["spot", "margin", "futures", "earn"],
  },
  {
    id: "aster",
    nameKey: "aster",
    brandColor: "#F4D5B1",
    logoKey: "aster",
    kind: "cex",
    status: "supported",
    credentialFields: ["apiKey", "secretKey"],
    needsAddress: false,
    balanceTypes: ["futures"],
  },
];

export const platformById = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<Platform, PlatformMeta>;

export const supportedPlatforms = PLATFORMS.filter((p) => p.status === "supported");
