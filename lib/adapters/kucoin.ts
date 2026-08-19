// KuCoin v2 adapter — browser-signed via the stateless relay (CORS blocked).
// Signature: Base64(HMAC-SHA256(timestamp + method + requestPath + body), secret).
// Spot (main+trade) + margin (net in quote currency). Futures requires a
// separate futures API key (out of scope); Earn API is product-specific.

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";

const HOST = "api.kucoin.com";

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

async function signedGet(cred: Credential, path: string, query = ""): Promise<unknown> {
  const timestamp = String(Date.now());
  const requestPath = `${path}${query ? `?${query}` : ""}`;
  const sign = await signB64(cred.secretKey, `${timestamp}GET${requestPath}`);
  const res = await fetch(`${relayBase()}/api/exchange-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "signed",
      platform: "kucoin",
      host: HOST,
      method: "GET",
      path,
      qs: query,
      headers: {
        "KC-API-KEY": cred.apiKey,
        "KC-API-SIGN": sign,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": cred.passphrase ?? "",
        "KC-API-KEY-VERSION": "2",
      },
    }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== "200000") {
    throw new Error(`KuCoin ${json.code ?? res.status}: ${json.msg ?? ""}`);
  }
  return json.data;
}

interface AccountRow {
  currency: string;
  balance: string;
  available: string;
  holds: string;
}

/** Fetch real KuCoin balances: spot (main+trade) + margin net. */
export async function kucoinFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing KuCoin credentials");

  const [main, trade, margin] = (await Promise.all([
    signedGet(cred, "/api/v2/accounts", "type=main").catch(() => []),
    signedGet(cred, "/api/v2/accounts", "type=trade").catch(() => []),
    signedGet(cred, "/api/v1/margin/account").catch(() => null),
  ])) as [AccountRow[], AccountRow[], { totalAssetOfQuoteCurrency?: string; totalLiabilityOfQuoteCurrency?: string } | null];

  const rows = [...(main ?? []), ...(trade ?? [])];
  const assets = [...new Set(rows.map((a) => a.currency).filter(Boolean))];
  const prices = await fetchUsdPrices(assets);
  const priceOf = (c: string) => prices[c] ?? 0;

  const spotUsd = rows.reduce((s, a) => s + +a.balance * priceOf(a.currency), 0);
  const marginUsd =
    Number(margin?.totalAssetOfQuoteCurrency ?? 0) -
    Number(margin?.totalLiabilityOfQuoteCurrency ?? 0);

  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotals: BalanceSubtotal[] = [
    { type: "spot", usd: round(spotUsd) },
    { type: "margin", usd: round(marginUsd) },
  ];
  return { totalValue: round(spotUsd + marginUsd), typeSubtotals: subtotals };
}
