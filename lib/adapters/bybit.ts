// Bybit v5 adapter — browser-direct (CORS verified).
// UNIFIED account (spot + derivatives, one wallet-balance call) + FUND.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices, fillOwnPrices } from "./pricing";

const BASE = "https://api.bybit.com";

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

interface CoinRow {
  coin: string;
  equity?: string;
  walletBalance?: string;
}

async function walletBalance(
  cred: Credential,
  accountType: string
): Promise<CoinRow[]> {
  const timestamp = String(Date.now());
  const qs = `accountType=${accountType}`;
  const sign = await hmacHex(cred.secretKey, `${timestamp}${qs}`);
  const res = await fetch(`${BASE}/v5/account/wallet-balance?${qs}`, {
    headers: {
      "X-BAPI-API-KEY": cred.apiKey,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-SIGN": sign,
      "X-BAPI-RECV-WINDOW": "10000",
    },
  });
  const json = (await res.json()) as {
    retCode?: number;
    retMsg?: string;
    result?: { list?: Array<{ coin?: CoinRow[] }> };
  };
  if (!res.ok || json.retCode !== 0) {
    throw new Error(`Bybit ${json.retCode ?? res.status}: ${json.retMsg ?? ""}`);
  }
  return json.result?.list?.[0]?.coin ?? [];
}

function sumUsd(coins: CoinRow[], priceOf: (c: string) => number): number {
  return coins.reduce(
    (s, c) => s + Number(c.equity ?? c.walletBalance ?? 0) * priceOf(c.coin),
    0
  );
}

/** Fetch real Bybit balances: unified (spot+derivatives) + funding. */
export async function bybitFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Bybit credentials");

  const [unified, fund] = await Promise.all([
    walletBalance(cred, "UNIFIED"),
    walletBalance(cred, "FUND"),
  ]);

  const assets = [...new Set([...unified, ...fund].map((c) => c.coin).filter(Boolean))];
  const prices = await fetchUsdPrices(assets);
  await fillOwnPrices(prices, assets, "bybit"); // own-exchange first
  const priceOf = (c: string) => prices[c] ?? 0;

  const unifiedUsd = sumUsd(unified, priceOf);
  const fundingUsd = sumUsd(fund, priceOf);

  const subtotals: BalanceSubtotal[] = [
    { type: "unified", usd: Math.round(unifiedUsd * 100) / 100 },
    { type: "funding", usd: Math.round(fundingUsd * 100) / 100 },
  ];
  return { totalValue: unifiedUsd + fundingUsd, typeSubtotals: subtotals };
}
