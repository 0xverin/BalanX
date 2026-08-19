// BalanX domain types — mirrors CONTEXT.md glossary

export type ChainId = "eth" | "bsc";

export interface Wallet {
  address: string;
  chain: ChainId;
}

/** CEX-style credentials (apiKey + secretKey [+ passphrase]). Address-based
 * platforms (OKX Dex, Hyperliquid) have no credentials — see Credential Source. */
export interface Credential {
  apiKey: string;
  secretKey: string;
  passphrase?: string;
}

export const PLATFORM_IDS = [
  "okx-dex",
  "hyperliquid",
  "okx-cex",
  "binance",
  "bybit",
  "gate",
  "bitget",
  "kucoin",
  "aster",
] as const;
export type Platform = (typeof PLATFORM_IDS)[number];

/** Balance categories across platforms (registry-driven). */
export type BalanceCategory =
  | "spot"
  | "funding"
  | "margin"
  | "earn"
  | "futures"
  | "unified"
  | "delivery"
  | "perps"
  | "spot-margin";

export interface TokenBalance {
  symbol: string;
  balance: string;
  price: number; // USD unit price
  usd: number; // balance * price
  chain: ChainId;
  isRiskToken: boolean;
}

export interface BalanceSubtotal {
  type: BalanceCategory;
  usd: number;
}

export interface Account {
  id: string;
  name: string;
  platform: Platform;
  createdAt: string; // ISO
  lastRefreshed: string; // ISO
  // address-based platforms (dex / hyperliquid)
  chains?: ChainId[];
  wallets?: Wallet[];
  tokens?: TokenBalance[]; // per-token USD detail (OKX all-token-balances)
  // credential-based platforms (cex)
  typeSubtotals?: BalanceSubtotal[];
  // aggregated USD value, same meaning across platforms
  totalValue: number;
  /** set when the last refresh of this account failed; keeps last value */
  error?: string;
  /** CEX credentials, stored only in the user's browser (ADR-0001) */
  credentials?: Credential;
}

export interface Snapshot {
  date: string; // YYYY-MM-DD (UTC+8 calendar day)
  total: number; // total USD across all accounts at that time
  perAccount: Record<string, number>; // accountId -> USD balance at that time
}
