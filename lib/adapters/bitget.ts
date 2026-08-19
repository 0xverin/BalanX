// Bitget v2 adapter — browser-signed via the stateless relay (CORS blocked).
// Signature: Base64(HMAC-SHA256(timestamp + method + requestPath + body), secret).
// Spot + futures across ALL product types (USDT-M umcbl, USDC-M cmcbl, COIN-M
// dmcbl), consistent with the Binance full-scope approach.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";
import { relayBase } from "./relay";

const HOST = "api.bitget.com";

// Query every Bitget futures product type (USDT-M / USDC-M / COIN-M).
// An endpoint or account that doesn't support a type rejects it with
// 40020 "Parameter productType error" — we skip that type, not the whole
// account, so whichever types the account has still get counted.
const FUTURES_TYPES = ["umcbl", "cmcbl", "dmcbl"] as const;
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

  const futuresUsd = usd(futures.umcbl) + usd(futures.cmcbl) + coin(futures.dmcbl);

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

  // Query every futures product type; skip the ones Bitget rejects with a
  // productType error, surface any other (real) failure.
  const isProductTypeError = (e: unknown) =>
    e instanceof Error && (e.message.includes("productType") || e.message.includes("40020"));
  const byType: FuturesByType = { umcbl: [], cmcbl: [], dmcbl: [] };
  for (const pt of FUTURES_TYPES) {
    try {
      byType[pt] = (await signedGet(cred, "/api/v2/mix/account/accounts", `productType=${pt}`)) as FuturesRow[];
    } catch (e) {
      if (isProductTypeError(e)) continue; // unsupported type for this account — skip
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
  const priceOf = (c: string) => prices[c] ?? 0;

  return aggregateBitget(spot, byType, priceOf);
}
