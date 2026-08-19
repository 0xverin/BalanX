// Binance adapter — browser-signed calls via the stateless relay across all
// balance types. Verified live: 8 endpoints, net margin equity, futures
// equity incl. unrealized PnL ≈ $49,790.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { relayBase } from "./relay";
import { fetchUsdPrices } from "./pricing";

const HOST = {
  api: "api.binance.com",
  fapi: "fapi.binance.com",
  dapi: "dapi.binance.com",
};

type HostKey = keyof typeof HOST;

/** HMAC-SHA256 hex (lowercase), as Binance signatures require. */
export async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Build the signed query string. Params sorted alphabetically
 * (URLSearchParams does this), timestamp appended, signature over the result.
 */
export async function signedQuery(
  secret: string,
  params: Record<string, string>,
  now: () => number = Date.now
): Promise<string> {
  const qs = new URLSearchParams({ ...params, timestamp: String(now()) }).toString();
  return `${qs}&signature=${await hmacHex(secret, qs)}`;
}

/** Relay base: browser origin in the browser, env-configured in tests/node. */
/**
 * Signed calls go through the stateless relay (Binance CORS blocks browser
 * requests carrying X-MBX-APIKEY). The signature is computed here in the
 * browser; the secret never leaves the client (ADR-0002).
 */
async function signedCall(
  cred: Credential,
  hostKey: HostKey,
  path: string,
  params: Record<string, string> = {},
  method: "GET" | "POST" = "GET"
) {
  const qs = await signedQuery(cred.secretKey, params);
  const res = await fetch(`${relayBase()}/api/exchange-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "signed",
      platform: "binance",
      host: HOST[hostKey],
      method,
      path,
      qs,
      headers: { "X-MBX-APIKEY": cred.apiKey },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    const code = json?.code ?? res.status;
    const msg = json?.msg ?? (json?.error ?? res.statusText);
    throw new Error(`Binance ${code}: ${msg}`);
  }
  return json;
}

const signedGet = (cred: Credential, host: HostKey, path: string, params: Record<string, string> = {}) =>
  signedCall(cred, host, path, params, "GET");

const signedPost = (cred: Credential, host: HostKey, path: string, params: Record<string, string> = {}) =>
  signedCall(cred, host, path, params, "POST");

// ── raw payload shapes ──────────────────────────────────────────
interface SpotBalances {
  balances?: Array<{ asset: string; free: string; locked: string }>;
}
interface FundRow {
  asset: string;
  free: string;
  locked: string;
}
interface EarnRow {
  asset: string;
  totalAmount?: string;
  amount?: string;
}
interface FuturesRow {
  asset: string;
  balance: string;
  crossUnPnl: string;
}
interface MarginAccount {
  totalNetAssetOfBtc?: string;
}
interface MarginIsolatedAccount {
  totalNetAssetOfBtc?: string;
}

export interface BinanceRaw {
  spot: SpotBalances;
  funding: FundRow[];
  marginCrossNetBtc: string;
  marginIsolatedNetBtc: string;
  earnFlex: EarnRow[];
  earnLocked: EarnRow[];
  futuresUsdm: FuturesRow[];
  futuresCoinm: FuturesRow[];
}

/** Every distinct asset with a non-zero balance that needs a USD price. */
export function uniqueAssets(raw: BinanceRaw): string[] {
  const assets = new Set<string>();
  const add = (a: string, amt: number) => {
    if (amt > 0) assets.add(a);
  };
  for (const b of raw.spot.balances ?? []) add(b.asset, +b.free + +b.locked);
  for (const f of raw.funding) add(f.asset, +f.free + +f.locked);
  for (const r of [...raw.earnFlex, ...raw.earnLocked]) add(r.asset, +(r.totalAmount ?? r.amount ?? 0));
  for (const a of raw.futuresCoinm) add(a.asset, +a.balance + +a.crossUnPnl);
  return [...assets];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Aggregate all balance types into a USD total + per-type subtotals.
 * `priceOf` is the injected price resolver (pure seam); margin uses the
 * net-equity BTC valuation; futures equity = balance + PnL.
 */
export function aggregateBinance(
  raw: BinanceRaw,
  priceOf: (asset: string) => number,
  btcUsd: number
): { totalValue: number; typeSubtotals: BalanceSubtotal[] } {
  const spotUsd = (raw.spot.balances ?? []).reduce(
    (s, b) => s + (+b.free + +b.locked) * priceOf(b.asset),
    0
  );
  const fundingUsd = raw.funding.reduce((s, f) => s + (+f.free + +f.locked) * priceOf(f.asset), 0);
  const marginUsd = (+raw.marginCrossNetBtc + +raw.marginIsolatedNetBtc) * btcUsd;
  const earnUsd = [...raw.earnFlex, ...raw.earnLocked].reduce(
    (s, r) => s + +(r.totalAmount ?? r.amount ?? 0) * priceOf(r.asset),
    0
  );
  const futuresUsd =
    raw.futuresUsdm.reduce((s, a) => s + (+a.balance + +a.crossUnPnl), 0) +
    raw.futuresCoinm.reduce((s, a) => s + (+a.balance + +a.crossUnPnl) * priceOf(a.asset), 0);

  const typeSubtotals: BalanceSubtotal[] = [
    { type: "spot", usd: round2(spotUsd) },
    { type: "funding", usd: round2(fundingUsd) },
    { type: "margin", usd: round2(marginUsd) },
    { type: "earn", usd: round2(earnUsd) },
    { type: "futures", usd: round2(futuresUsd) },
  ];
  return {
    totalValue: round2(spotUsd + fundingUsd + marginUsd + earnUsd + futuresUsd),
    typeSubtotals,
  };
}

/** Fetch the real USD total and per-type subtotals for a Binance account. */
export async function binanceFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Binance credentials");

  const [spot, funding, marginCross, marginIso, earnFlex, earnLocked, usdm, coinm] =
    await Promise.all([
      signedGet(cred, "api", "/api/v3/account", { omitZeroBalances: "true" }) as Promise<SpotBalances>,
      signedPost(cred, "api", "/sapi/v1/asset/get-funding-asset", {}) as Promise<FundRow[]>,
      signedGet(cred, "api", "/sapi/v1/margin/account", {}) as Promise<MarginAccount>,
      signedGet(cred, "api", "/sapi/v1/margin/isolated/account", {}) as Promise<MarginIsolatedAccount>,
      signedGet(cred, "api", "/sapi/v1/simple-earn/flexible/position", { size: "100" }) as Promise<{ rows: EarnRow[] }>,
      signedGet(cred, "api", "/sapi/v1/simple-earn/locked/position", { size: "100" }) as Promise<{ rows: EarnRow[] }>,
      signedGet(cred, "fapi", "/fapi/v2/balance", {}) as Promise<FuturesRow[]>,
      signedGet(cred, "dapi", "/dapi/v1/balance", {}) as Promise<FuturesRow[]>,
    ]);

  const raw: BinanceRaw = {
    spot,
    funding,
    marginCrossNetBtc: marginCross.totalNetAssetOfBtc ?? "0",
    marginIsolatedNetBtc: marginIso.totalNetAssetOfBtc ?? "0",
    earnFlex: earnFlex.rows ?? [],
    earnLocked: earnLocked.rows ?? [],
    futuresUsdm: usdm,
    futuresCoinm: coinm,
  };

  // BTC is always needed for margin net-equity valuation, even when the user
  // holds no BTC (prices only fetch held assets).
  const prices = await fetchUsdPrices([...uniqueAssets(raw), "BTC"]);
  const priceOf = (asset: string) => prices[asset] ?? 0;
  const btc = prices["BTC"] ?? 1;

  return aggregateBinance(raw, priceOf, btc);
}
