// Bitget v2 adapter — browser-signed via the stateless relay (CORS blocked).
// Signature: Base64(HMAC-SHA256(timestamp + method + requestPath + body), secret).
// Spot + futures across ALL product types (USDT-M umcbl, USDC-M cmcbl, COIN-M
// dmcbl), consistent with the Binance full-scope approach.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";
import { relayBase } from "./relay";

const HOST = "api.bitget.com";

// /api/v2/mix/account/accounts accepts only these productType values
// (USDC-M "cmcbl" is rejected with 40020 on this endpoint).
const FUTURES_TYPES = ["umcbl", "dmcbl"] as const;
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
}

export type FuturesByType = Record<FuturesType, FuturesRow[]>;


/**
 * Aggregate Bitget (pure seam): spot USD + futures USD across all product
 * types. USDT-M / USDC-M use `usdtEquity` (already USDT-converted) with
 * `equity` fallback; COIN-M multiplies coin equity by its USD price.
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
  const usd = (rows: FuturesRow[]) =>
    rows.reduce(
      (s, a) => s + Number(a.usdtEquity ?? a.equity ?? 0) * (a.usdtEquity ? 1 : priceOf(a.coin ?? "")),
      0
    );
  const coin = (rows: FuturesRow[]) =>
    rows.reduce((s, a) => s + Number(a.equity ?? 0) * priceOf(a.coin ?? ""), 0);

  const futuresUsd = usd(futures.umcbl) + coin(futures.dmcbl);

  const typeSubtotals: BalanceSubtotal[] = [
    { type: "spot", usd: Math.round(spotUsd * 100) / 100 },
    { type: "futures", usd: Math.round(futuresUsd * 100) / 100 },
  ];
  return {
    totalValue: Math.round((spotUsd + futuresUsd) * 100) / 100,
    typeSubtotals,
  };
}

/** Fetch real Bitget balances: spot + futures (USDT-M / USDC-M / COIN-M). */
export async function bitgetFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Bitget credentials");

  const spot = (await signedGet(cred, "/api/v2/spot/account/assets")) as SpotRow[];

  // Query every futures product type; a failure surfaces (no silent zero).
  const futures = (await Promise.all(
    FUTURES_TYPES.map((pt) =>
      signedGet(cred, "/api/v2/mix/account/accounts", `productType=${pt}`)
    )
  )) as unknown as [FuturesRow[], FuturesRow[], FuturesRow[]];
  const byType: FuturesByType = { umcbl: futures[0], dmcbl: futures[1] };

  const assets = [
    ...new Set([
      ...spot.map((a) => a.coin),
      ...Object.values(byType).flatMap((l) => l.map((a) => a.coin ?? "")),
    ].filter(Boolean)),
  ];
  const prices = await fetchUsdPrices(assets);
  const priceOf = (c: string) => prices[c] ?? 0;

  return aggregateBitget(spot, byType, priceOf);
}
