// BalanX domain types — mirrors CONTEXT.md glossary

export type ChainId = "eth" | "bsc";

export interface Wallet {
  address: string;
  chain: ChainId;
}

export interface OkxDexCredential {
  apiKey: string;
  secretKey: string;
  passphrase: string;
}

export interface BinanceCredential {
  apiKey: string;
  secretKey: string;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  price: number; // USD unit price
  usd: number; // balance * price
  chain: ChainId;
  isRiskToken: boolean;
}

export type BinanceType = "spot" | "funding" | "margin" | "earn" | "futures";

export interface BinanceTypeSubtotal {
  type: BinanceType;
  usd: number;
}

export const PLATFORM_IDS = ["okx-dex", "binance", "gate", "bybit", "bitget"] as const;
export type Platform = (typeof PLATFORM_IDS)[number];

export interface Account {
  id: string;
  name: string;
  platform: Platform;
  createdAt: string; // ISO
  lastRefreshed: string; // ISO
  // DEX (okx-dex)
  chains?: ChainId[];
  wallets?: Wallet[];
  tokens?: TokenBalance[]; // per-token USD detail (live from OKX all-token-balances)
  // CEX (binance)
  typeSubtotals?: BinanceTypeSubtotal[];
  // aggregated USD value, same meaning across platforms
  totalValue: number;
  /** set when the last refresh of this account failed; keeps last value */
  error?: string;
  /** platform API credentials, stored only in the user's browser (ADR-0001) */
  credentials?: OkxDexCredential | BinanceCredential;
}

export interface Snapshot {
  date: string; // YYYY-MM-DD
  total: number; // total USD across all accounts at that time
  perAccount: Record<string, number>; // accountId -> USD balance at that time
}
