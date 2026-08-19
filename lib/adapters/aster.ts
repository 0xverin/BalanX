// Aster adapter — Binance-fork API (fapi.asterdex.com), browser-direct
// (CORS verified: allow-origin * + allow-headers *). Same HMAC-SHA256 hex
// signing as Binance. Futures balance confirmed; spot best-effort.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";

const FAPI = "https://fapi.asterdex.com";
const SPOT = "https://api.asterdex.com";

async function hmacHex(secret: string, data: string): Promise<string> {
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

async function signedGet(
  cred: Credential,
  base: string,
  path: string,
  query = ""
): Promise<unknown> {
  const qs = query + (query ? "&" : "") + "timestamp=" + Date.now();
  const sig = await hmacHex(cred.secretKey, qs);
  const res = await fetch(`${base}${path}?${qs}&signature=${sig}`, {
    headers: { "X-MBX-APIKEY": cred.apiKey },
  });
  const json = await res.json();
  if (!res.ok) {
    const code = json?.code ?? res.status;
    const msg = json?.msg ?? res.statusText;
    throw new Error(`Aster ${code}: ${msg}`);
  }
  return json;
}

/** Fetch real Aster balances: futures (fapi/v2/balance) + spot best-effort. */
export async function asterFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Aster credentials");

  const [futures, spot] = await Promise.all([
    signedGet(cred, FAPI, "/fapi/v2/balance") as Promise<
      Array<{ asset: string; balance: string; unrealizedProfit: string }>
    >,
    signedGet(cred, SPOT, "/api/v3/account", "omitZeroBalances=true").catch(() => null) as Promise<{
      balances?: Array<{ asset: string; free: string; locked: string }>;
    } | null>,
  ]);

  const futuresAssets = futures.map((a) => a.asset);
  const spotAssets = (spot?.balances ?? []).map((b) => b.asset);
  const prices = await fetchUsdPrices([...new Set([...futuresAssets, ...spotAssets])]);
  const priceOf = (c: string) => prices[c] ?? 0;

  const futuresUsd = futures.reduce(
    (s, a) => s + (+a.balance + +a.unrealizedProfit) * priceOf(a.asset),
    0
  );
  const spotUsd = (spot?.balances ?? []).reduce(
    (s, b) => s + (+b.free + +b.locked) * priceOf(b.asset),
    0
  );

  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotals: BalanceSubtotal[] = [{ type: "futures", usd: round(futuresUsd) }];
  if (spot) subtotals.push({ type: "spot", usd: round(spotUsd) });
  return { totalValue: round(futuresUsd + spotUsd), typeSubtotals: subtotals };
}
