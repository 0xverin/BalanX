// Portfolio — the single state module for BalanX (the one test seam).
// All user-visible behavior (accounts, refresh, snapshots, filters, totals)
// passes through here. UI components are a thin shell over this module.
// Data fetching is an injected port (`FetchBalance`) so tests use fakes and
// real exchange adapters slot in without changing this module.

import { PLATFORM_IDS } from "./types";
import type {
  Account,
  BalanceSubtotal,
  Platform,
  Snapshot,
  TokenBalance,
} from "./types";
import { utc8Date } from "./scheduler";

export type PlatformFilter = "all" | Platform;

export interface PortfolioState {
  accounts: Account[];
  snapshots: Snapshot[];
  lastRefreshed: string;
  filter: PlatformFilter;
  filterRiskTokens: boolean;
}

export interface BalanceResult {
  totalValue: number;
  tokens?: TokenBalance[];
  typeSubtotals?: BalanceSubtotal[];
  error?: string;
}

export interface FetchOptions {
  /** when true, risk tokens are included in balances (default: excluded) */
  includeRiskTokens?: boolean;
}

export type FetchBalance = (
  account: Account,
  opts?: FetchOptions
) => Promise<BalanceResult>;

export interface SerializedState {
  version: typeof STATE_VERSION;
  exportedAt: string;
  accounts: Account[];
  snapshots: Snapshot[];
  filter: PlatformFilter;
  filterRiskTokens: boolean;
}

// v2: invalidates persisted demo-era state (mock accounts) from v1
// localStorage / v1 exports — one-time bump when leaving the demo phase.
export const STATE_VERSION = 2;

export function createEmptyState(): PortfolioState {
  return {
    accounts: [],
    snapshots: [],
    lastRefreshed: "",
    filter: "all",
    filterRiskTokens: true,
  };
}

/** Total USD across all accounts. */
export function totalValue(s: PortfolioState): number {
  return s.accounts.reduce((acc, a) => acc + a.totalValue, 0);
}

/** Accounts after applying the platform filter. */
export function visibleAccounts(s: PortfolioState): Account[] {
  return s.filter === "all"
    ? s.accounts
    : s.accounts.filter((a) => a.platform === s.filter);
}

/** Total value change vs the previous snapshot (0 when no baseline). */
export function deltaVsYesterday(s: PortfolioState): number {
  const yesterday = s.snapshots[s.snapshots.length - 2]?.total ?? totalValue(s);
  return totalValue(s) - yesterday;
}

export function addAccount(s: PortfolioState, account: Account): PortfolioState {
  return { ...s, accounts: [account, ...s.accounts] };
}

export function removeAccount(s: PortfolioState, id: string): PortfolioState {
  return { ...s, accounts: s.accounts.filter((a) => a.id !== id) };
}

export function setFilter(s: PortfolioState, filter: PlatformFilter): PortfolioState {
  return { ...s, filter };
}

export function setRiskFilter(s: PortfolioState, v: boolean): PortfolioState {
  return { ...s, filterRiskTokens: v };
}

/**
 * Refresh every account through the injected fetcher. Failures are isolated:
 * a failed account keeps its last value and gets an `error` marker; the rest
 * update normally. `lastRefreshed` advances only for successful fetches.
 */
export async function refreshAll(
  s: PortfolioState,
  fetch: FetchBalance,
  now: () => Date = () => new Date(),
  opts?: FetchOptions
): Promise<PortfolioState> {
  const ts = now().toISOString();
  const results = await Promise.all(
    s.accounts.map(async (a) => {
      try {
        const r = await fetch(a, opts);
        const next: Account = {
          ...a,
          totalValue: r.totalValue,
          lastRefreshed: ts,
          error: r.error,
        };
        if (r.tokens) next.tokens = r.tokens;
        if (r.typeSubtotals) next.typeSubtotals = r.typeSubtotals;
        return next;
      } catch (e) {
        return { ...a, error: e instanceof Error ? e.message : String(e) };
      }
    })
  );
  return { ...s, accounts: results, lastRefreshed: ts };
}

/**
 * Record a snapshot of every account's current balance. Same-day snapshots
 * replace each other; per-account granularity supports future daily-PnL export.
 */
export function appendSnapshot(
  s: PortfolioState,
  now: () => Date = () => new Date()
): PortfolioState {
  const date = utc8Date(now());
  const snap: Snapshot = {
    date,
    total: totalValue(s),
    perAccount: Object.fromEntries(s.accounts.map((a) => [a.id, a.totalValue])),
  };
  const last = s.snapshots[s.snapshots.length - 1];
  const snapshots =
    last && last.date === date ? [...s.snapshots.slice(0, -1), snap] : [...s.snapshots, snap];
  return { ...s, snapshots };
}

export function serializeState(s: PortfolioState): SerializedState {
  return {
    version: STATE_VERSION,
    exportedAt: new Date().toISOString(),
    // drop the transient `error` field — a stale refresh error must not
    // survive a reload and keep showing on the card
    accounts: s.accounts.map((a) => {
      const clean = { ...a };
      delete (clean as { error?: string }).error;
      return clean;
    }),
    snapshots: s.snapshots,
    filter: s.filter,
    filterRiskTokens: s.filterRiskTokens,
  };
}

function isAccount(x: unknown): x is Account {
  if (typeof x !== "object" || x === null) return false;
  const a = x as Record<string, unknown>;
  return (
    typeof a.id === "string" &&
    typeof a.name === "string" &&
    typeof a.platform === "string" &&
    typeof a.totalValue === "number"
  );
}

function isSnapshot(x: unknown): x is Snapshot {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s.date === "string" &&
    typeof s.total === "number" &&
    typeof s.perAccount === "object" &&
    s.perAccount !== null
  );
}

/** Restore state from a backup/persisted payload. Returns null when invalid. */
export function deserializeState(raw: unknown): PortfolioState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Record<string, unknown>;
  if (d.version !== STATE_VERSION) return null;
  if (!Array.isArray(d.accounts) || !d.accounts.every(isAccount)) return null;
  if (!Array.isArray(d.snapshots) || !d.snapshots.every(isSnapshot)) return null;
  const knownFilters: PlatformFilter[] = ["all", ...PLATFORM_IDS];
  const filter = knownFilters.includes(d.filter as PlatformFilter)
    ? (d.filter as PlatformFilter)
    : "all";
  return {
    accounts: d.accounts,
    snapshots: d.snapshots,
    lastRefreshed: "",
    filter,
    filterRiskTokens: d.filterRiskTokens !== false,
  };
}
