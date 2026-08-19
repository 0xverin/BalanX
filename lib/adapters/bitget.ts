// Bitget v2 adapter — browser-signed via the stateless relay (CORS blocked).
// Signature: Base64(HMAC-SHA256(timestamp + method + requestPath + body), secret).

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";

const HOST = "api.bitget.com";

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

function relayBase(): string {
  return typeof window !== "undefined"
    ? window.location.origin
    : (process.env.BALANX_APP_URL ?? "");
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

/** Fetch real Bitget balances: spot + futures (USDT-M, coin-M via pricing). */
export async function bitgetFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Bitget credentials");

  const spot = (await signedGet(cred, "/api/v2/spot/account/assets").catch(() => [])) as
    Array<{ coin: string; available: string; frozen: string; locked?: string }>;
  const umcbl = (await signedGet(cred, "/api/v2/mix/account/accounts", "productType=umcbl").catch(() => [])) as
    Array<{ coin: string; equity: string; usdtEquity?: string }>;
  const dmcbl = (await signedGet(cred, "/api/v2/mix/account/accounts", "productType=dmcbl").catch(() => [])) as
    Array<{ coin: string; equity: string; usdtEquity?: string }>;

  const assets = [...new Set([...spot, ...umcbl, ...dmcbl].map((a) => a.coin).filter(Boolean))];
  const prices = await fetchUsdPrices(assets);
  const priceOf = (c: string) => prices[c] ?? 0;

  const spotUsd = spot.reduce(
    (s, a) => s + (+a.available + +a.frozen + Number(a.locked ?? 0)) * priceOf(a.coin),
    0
  );
  const futuresUsd =
    umcbl.reduce((s, a) => s + Number(a.usdtEquity ?? a.equity ?? 0), 0) +
    dmcbl.reduce((s, a) => s + +a.equity * priceOf(a.coin), 0);

  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotals: BalanceSubtotal[] = [
    { type: "spot", usd: round(spotUsd) },
    { type: "futures", usd: round(futuresUsd) },
  ];
  return { totalValue: round(spotUsd + futuresUsd), typeSubtotals: subtotals };
}
