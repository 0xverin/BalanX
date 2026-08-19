// Bitget v2 adapter — browser-signed via the stateless relay (CORS blocked).
// Signature: Base64(HMAC-SHA256(timestamp + method + requestPath + body), secret).
// Spot + futures. NOTE: v2 productType enum is UPPERCASE (USDT-FUTURES /
// COIN-FUTURES / USDC-FUTURES) — the v1-style "umcbl/dmcbl" values are rejected
// with 40020. Spot long-tail tokens (e.g. BTW) are priced via Bitget's own
// public spot ticker, since Binance/OKX don't list them.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";
import { relayBase } from "./relay";

const HOST = "api.bitget.com";

const FUTURES_TYPES = ["USDT-FUTURES", "COIN-FUTURES", "USDC-FUTURES"] as const;
type FuturesType = (typeof FUTURES_TYPES)[number];

async function signB64(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function signedGet(
  cred: Credential,
  path: string,
  query = ""
): Promise<unknown> {
  const timestamp = String(Date.now());
  const requestPath = `${path}${query ? `?${query}` : ""}`;
  const sign = await signB64(cred.secretKey, `${timestamp}GET${requestPath}`);
  const res = await fetch(`${relayBase()}/api/exchange-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "signed",
      platform: "bitget",
      host: HOST,
      method: "GET",
      path,
      qs: query,
      headers: {
        "ACCESS-KEY": cred.apiKey,
        "ACCESS-SIGN": sign,
        "ACCESS-TIMESTAMP": timestamp,
        "ACCESS-PASSPHRASE": cred.passphrase ?? "",
      },
    }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== "00000") {
    throw new Error(`Bitget ${json.code ?? res.status}: ${json.msg ?? ""}`);
  }
  return json.data;
}

export interface SpotRow {
  coin: string;
  available: string;
  frozen: string;
  locked?: string;
}

export interface FuturesRow {
  coin?: string;
  equity?: string;
  usdtEquity?: string;
  accountEquity?: string;
}

export type FuturesByType = Record<FuturesType, FuturesRow[]>;

const coinValue = (a: FuturesRow, priceOf: (c: string) => number) =>
  Number(a.usdtEquity ?? a.equity ?? a.accountEquity ?? 0) *
    (a.usdtEquity || a.accountEquity ? 1 : priceOf(a.coin ?? ""));

/**
 * Aggregate Bitget (pure seam): spot USD + futures USD across all product
 * types. USDT/USDC-M use their USDT equity; COIN-M multiplies coin equity.
 */
export function aggregateBitget(
  spot: SpotRow[],
  futures: FuturesByType,
  priceOf: (coin: string) => number
): { totalValue: number; typeSubtotals: BalanceSubtotal[] } {
  const spotUsd = spot.reduce(
    (s, a) => s + (+a.available + +a.frozen + Number(a.locked ?? 0)) * priceOf(a.coin),
    0
  );
  const futuresUsd =
    futures["USDT-FUTURES"].reduce((s, a) => s + coinValue(a, priceOf), 0) +
    futures["USDC-FUTURES"].reduce((s, a) => s + coinValue(a, priceOf), 0) +
    futures["COIN-FUTURES"].reduce((s, a) => s + coinValue(a, priceOf), 0);

  const typeSubtotals: BalanceSubtotal[] = [
    { type: "spot", usd: Math.round(spotUsd * 100) / 100 },
    { type: "futures", usd: Math.round(futuresUsd * 100) / 100 },
  ];
  return {
    totalValue: Math.round((spotUsd + futuresUsd) * 100) / 100,
    typeSubtotals,
  };
}

/**
 * Price long-tail spot assets via Bitget's public spot ticker (routed through
 * the relay so browser CORS is irrelevant), filling gaps the generic pricing
 * couldn't cover — e.g. BTW, a BEP-20 token not listed on the price sources.
 */
async function priceSpotTail(
  spot: SpotRow[],
  prices: Record<string, number>,
  cred: Credential
): Promise<void> {
  for (const a of spot) {
    if (prices[a.coin]) continue;
    try {
      const data = (await signedGet(
        cred,
        "/api/v2/spot/market/tickers",
        `symbol=${a.coin.toUpperCase()}USDT`
      )) as Array<{ lastPr?: string }>;
      const last = Number(data?.[0]?.lastPr);
      if (Number.isFinite(last) && last > 0) prices[a.coin] = last;
    } catch {
      /* not listed / no price — stays unpriced */
    }
  }
}

/** Fetch real Bitget balances: spot + futures (USDT/USDC/COIN-M). */
export async function bitgetFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Bitget credentials");

  const spot = (await signedGet(cred, "/api/v2/spot/account/assets")) as SpotRow[];

  // futures: skip product types Bitget rejects with a "productType" error
  const isProductTypeError = (e: unknown) =>
    e instanceof Error && (e.message.includes("productType") || e.message.includes("40020"));
  const byType: FuturesByType = { "USDT-FUTURES": [], "COIN-FUTURES": [], "USDC-FUTURES": [] };
  for (const pt of FUTURES_TYPES) {
    try {
      byType[pt] = (await signedGet(
        cred,
        "/api/v2/mix/account/accounts",
        `productType=${pt}`
      )) as FuturesRow[];
    } catch (e) {
      if (isProductTypeError(e)) continue;
      throw e;
    }
  }

  const assets = [
    ...new Set([
      ...spot.map((a) => a.coin),
      ...Object.values(byType).flatMap((l) => l.map((a) => a.coin ?? "")),
    ].filter(Boolean)),
  ];
  const prices = await fetchUsdPrices(assets);
  await priceSpotTail(spot, prices, cred); // long-tail spot tokens via Bitget ticker
  const priceOf = (c: string) => prices[c] ?? 0;

  return aggregateBitget(spot, byType, priceOf);
}
