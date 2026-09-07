import { describe, expect, it, vi } from "vitest";
import {
  FETCH_TIMEOUT_MS,
  addAccount,
  appendSnapshot,
  createEmptyState,
  deltaVsLastSnapshot,
  deserializeState,
  removeAccount,
  refreshAll,
  serializeState,
  setFilter,
  setRiskFilter,
  totalValue,
  visibleAccounts,
  type PortfolioState,
} from "./portfolio";
import type { Account, Snapshot } from "./types";

const okxAccount = (over: Partial<Account> = {}): Account => ({
  id: "a1",
  name: "Cold Wallet",
  platform: "okx-dex",
  createdAt: "2026-08-01T00:00:00.000Z",
  lastRefreshed: "2026-08-18T00:00:00.000Z",
  chains: ["eth", "bsc"],
  wallets: [{ address: "0x1234", chain: "eth" }],
  totalValue: 1000,
  ...over,
});

const binanceAccount = (over: Partial<Account> = {}): Account => ({
  id: "b1",
  name: "Binance Main",
  platform: "binance",
  createdAt: "2026-08-01T00:00:00.000Z",
  lastRefreshed: "2026-08-18T00:00:00.000Z",
  typeSubtotals: [{ type: "spot", usd: 500 }],
  totalValue: 500,
  ...over,
});

const snap = (date: string, total: number, perAccount: Record<string, number> = {}): Snapshot => ({
  date,
  total,
  perAccount,
});

describe("totalValue", () => {
  it("sums the USD value of every account", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount(), binanceAccount()],
    };
    expect(totalValue(s)).toBe(1500);
  });

  it("is 0 with no accounts", () => {
    expect(totalValue(createEmptyState())).toBe(0);
  });
});

describe("visibleAccounts", () => {
  it("returns all accounts when filter is all", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount(), binanceAccount()],
    };
    expect(visibleAccounts(s).map((a) => a.id)).toEqual(["a1", "b1"]);
  });

  it("returns only matching-platform accounts when filtered", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount(), binanceAccount()],
      filter: "binance",
    };
    expect(visibleAccounts(s).map((a) => a.id)).toEqual(["b1"]);
  });
});

describe("deltaVsLastSnapshot", () => {
  it("compares the current total against the most recent eligible snapshot", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1100 })],
      lastRefreshed: "2026-08-18T01:00:00.000Z",
      snapshots: [snap("2026-08-17", 900), snap("2026-08-18", 1000)],
    };
    expect(deltaVsLastSnapshot(s)).toBe(100);
  });

  it("returns null when there is no eligible baseline (show '—' in the UI)", () => {
    expect(deltaVsLastSnapshot(createEmptyState())).toBeNull();
    // restored state has no lastRefreshed epoch yet → no point predates the
    // current balance moment → no baseline until the first refresh
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount()],
      snapshots: [snap("2026-08-18", 1000)],
    };
    expect(deltaVsLastSnapshot(s)).toBeNull();
  });

  it("excludes the snapshot just recorded (recorded at/after the balance epoch) — the auto\n  snapshot still compares against the previous point (manual or auto)", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1100 })],
      lastRefreshed: "2026-08-18T16:00:00.000Z",
      snapshots: [
        { date: "2026-08-17", at: "2026-08-17T16:00:00.000Z", total: 900, perAccount: {} },
        { date: "2026-08-18", at: "2026-08-18T16:00:05.000Z", total: 1100, perAccount: {} },
      ],
    };
    expect(deltaVsLastSnapshot(s)).toBe(200); // vs 08-17, not the just-made 18th point
  });

  it("treats snapshots without `at` (pre-change exports) as eligible baselines", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1100 })],
      lastRefreshed: "2026-08-18T01:00:00.000Z",
      snapshots: [snap("2026-08-17", 1000)],
    };
    expect(deltaVsLastSnapshot(s)).toBe(100);
  });
});

describe("addAccount / removeAccount", () => {
  it("prepends a new account and total grows", () => {
    let s: PortfolioState = { ...createEmptyState(), accounts: [okxAccount()] };
    s = addAccount(s, binanceAccount());
    expect(s.accounts.map((a) => a.id)).toEqual(["b1", "a1"]);
    expect(totalValue(s)).toBe(1500);
  });

  it("removes an account and it no longer counts towards total", () => {
    let s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount(), binanceAccount()],
    };
    s = removeAccount(s, "a1");
    expect(s.accounts.map((a) => a.id)).toEqual(["b1"]);
    expect(totalValue(s)).toBe(500);
  });
});

describe("setFilter / setRiskFilter", () => {
  it("sets the platform filter", () => {
    const s = setFilter(createEmptyState(), "okx-dex");
    expect(s.filter).toBe("okx-dex");
  });

  it("toggles the risk-token filter", () => {
    expect(setRiskFilter(createEmptyState(), false).filterRiskTokens).toBe(false);
  });
});

describe("refreshAll", () => {
  const now = () => new Date("2026-08-18T12:00:00.000Z");

  it("updates balances and the global last-refreshed timestamp", async () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1 })],
    };
    const fetch = async () => ({ totalValue: 2000 });
    const out = await refreshAll(s, fetch, now);
    expect(out.accounts[0].totalValue).toBe(2000);
    expect(out.accounts[0].lastRefreshed).toBe("2026-08-18T12:00:00.000Z");
    expect(out.lastRefreshed).toBe("2026-08-18T12:00:00.000Z");
  });

  it("isolates failures: a failed account keeps its last value and is flagged", async () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1000 }), binanceAccount({ totalValue: 500 })],
    };
    const fetch = async (a: Account) => {
      if (a.platform === "okx-dex") throw new Error("rate limited");
      return { totalValue: 600 };
    };
    const out = await refreshAll(s, fetch, now);
    const okx = out.accounts.find((a) => a.id === "a1")!;
    const bin = out.accounts.find((a) => a.id === "b1")!;
    expect(okx.totalValue).toBe(1000); // kept last value
    expect(okx.error).toBe("rate limited");
    expect(bin.totalValue).toBe(600);
    expect(bin.error).toBeUndefined();
  });

  it("passes fetch options through to the fetcher", async () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount()],
    };
    const seen: unknown[] = [];
    const fetch = async (_a: Account, opts?: { includeRiskTokens?: boolean }) => {
      seen.push(opts);
      return { totalValue: 1 };
    };
    await refreshAll(s, fetch, now, { includeRiskTokens: true });
    expect(seen).toEqual([{ includeRiskTokens: true }]);
  });

  it("stores per-type subtotals and tokens returned by the adapter", async () => {
    const s: PortfolioState = { ...createEmptyState(), accounts: [binanceAccount()] };
    const fetch = async () => ({
      totalValue: 700,
      typeSubtotals: [{ type: "futures" as const, usd: 700, note: "incl. unrealized PnL" }],
    });
    const out = await refreshAll(s, fetch, now);
    expect(out.accounts[0].typeSubtotals?.[0].usd).toBe(700);
  });

  it("times out a hung account after FETCH_TIMEOUT_MS, keeping its last value", async () => {
    vi.useFakeTimers();
    try {
      const s: PortfolioState = {
        ...createEmptyState(),
        accounts: [okxAccount({ totalValue: 1000 })],
      };
      const hung = () => new Promise<never>(() => {}); // never resolves
      const p = refreshAll(s, hung, now);
      await vi.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS);
      const out = await p;
      expect(out.accounts[0].totalValue).toBe(1000); // last value kept
      expect(out.accounts[0].error).toContain("timed out");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("appendSnapshot", () => {
  const now = () => new Date("2026-08-18T00:00:00.000Z");

  it("appends a snapshot with per-account granularity", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1000 }), binanceAccount({ totalValue: 500 })],
    };
    const out = appendSnapshot(s, now);
    expect(out.snapshots).toHaveLength(1);
    expect(out.snapshots[0].date).toBe("2026-08-18");
    expect(out.snapshots[0].total).toBe(1500);
    expect(out.snapshots[0].perAccount).toEqual({ a1: 1000, b1: 500 });
    expect(out.snapshots[0].at).toBe("2026-08-18T00:00:00.000Z");
  });

  it("replaces the same-day snapshot instead of duplicating", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount({ totalValue: 1100 })],
      snapshots: [snap("2026-08-18", 1000, { a1: 1000 })],
    };
    const out = appendSnapshot(s, now);
    expect(out.snapshots).toHaveLength(1);
    expect(out.snapshots[0].total).toBe(1100);
  });

  it("labels snapshots by the UTC+8 calendar date, not UTC", () => {
    // 2026-08-18T17:00:00Z = 01:00 on 2026-08-19 in UTC+8
    const late = () => new Date("2026-08-18T17:00:00.000Z");
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount()],
    };
    const out = appendSnapshot(s, late);
    expect(out.snapshots[0].date).toBe("2026-08-19");
  });
});

describe("serialize / deserialize", () => {
  it("round-trips accounts, snapshots and preferences", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [okxAccount()],
      snapshots: [snap("2026-08-18", 1000, { a1: 1000 })],
      filter: "binance",
      filterRiskTokens: false,
    };
    const restored = deserializeState(serializeState(s));
    expect(restored).not.toBeNull();
    expect(restored?.accounts).toHaveLength(1);
    expect(restored?.accounts[0].id).toBe("a1");
    expect(restored?.snapshots[0].perAccount.a1).toBe(1000);
    expect(restored?.filter).toBe("binance");
    expect(restored?.filterRiskTokens).toBe(false);
  });

  it("drops the transient error field but keeps credentials on persist", () => {
    const s: PortfolioState = {
      ...createEmptyState(),
      accounts: [
        okxAccount({
          error: "Binance 0: Service unavailable from a restricted location",
          credentials: { apiKey: "k", secretKey: "s" },
        }),
      ],
    };
    const serialized = serializeState(s);
    expect(serialized.accounts[0]).not.toHaveProperty("error");
    expect((serialized.accounts[0] as { credentials?: object }).credentials).toMatchObject({
      apiKey: "k",
      secretKey: "s",
    });
    // round-trip: still no stale error, credentials intact
    const restored = deserializeState(serialized);
    expect(restored?.accounts[0]).not.toHaveProperty("error");
    expect((restored?.accounts[0] as { credentials?: { apiKey?: string } }).credentials?.apiKey).toBe("k");
  });

  it("returns null for invalid or version-mismatched payloads", () => {
    expect(deserializeState(null)).toBeNull();
    expect(deserializeState({})).toBeNull();
    expect(deserializeState({ version: 999, accounts: [] })).toBeNull();
    expect(deserializeState({ version: 1, accounts: "nope" })).toBeNull();
  });
});
