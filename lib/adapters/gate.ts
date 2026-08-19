// Gate v4 adapter — browser-signed via the stateless relay (CORS blocked).
// Signature: hex(HMAC-SHA512(method + path + query + body + timestamp), secret).

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { fetchUsdPrices } from "./pricing";

const HOST = "api.gateio.ws";

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function relayBase(): string {
  return typeof window !== "undefined"
    ? window.location.origin
    : (process.env.BALANX_APP_URL ?? "");
}

async function signedGet(cred: Credential, path: string): Promise<unknown> {
  const timestamp = String(Date.now());
  const sign = await hmacHex(cred.secretKey, `GET${path}${timestamp}`);
  const res = await fetch(`${relayBase()}/api/exchange-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "signed",
      platform: "gate",
      host: HOST,
      method: "GET",
      path,
      qs: "",
      headers: { KEY: cred.apiKey, Timestamp: timestamp, SIGN: sign },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.label ?? json?.message ?? res.statusText;
    throw new Error(`Gate ${res.status}: ${msg}`);
  }
  return json;
}

interface SpotAccount {
  currency: string;
  available: string;
  locked: string;
}

interface MarginAccount extends SpotAccount {
  borrowed?: string;
}

/** Fetch real Gate balances: spot + spot margin + futures (usdt) + delivery. */
export async function gateFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Gate credentials");

  const [spot, margin, futures, delivery] = (await Promise.all([
    signedGet(cred, "/api/v4/spot/accounts").catch(() => []),
    signedGet(cred, "/api/v4/spot/margin_accounts").catch(() => []),
    signedGet(cred, "/api/v4/futures/usdt/accounts").catch(() => null),
    signedGet(cred, "/api/v4/futures/delivery/accounts").catch(() => null),
  ])) as [SpotAccount[], MarginAccount[], { total?: string } | null, { total?: string } | null];

  const assets = [
    ...new Set(
      [...(spot as SpotAccount[]), ...(margin as MarginAccount[])]
        .map((a) => a.currency)
        .filter(Boolean)
    ),
  ];
  const prices = await fetchUsdPrices(assets);
  const priceOf = (c: string) => prices[c] ?? 0;

  const spotUsd = (spot as SpotAccount[]).reduce(
    (s, a) => s + (+a.available + +a.locked) * priceOf(a.currency),
    0
  );
  const marginUsd = (margin as MarginAccount[]).reduce(
    (s, a) => s + (+a.available + +a.locked - Number(a.borrowed ?? 0)) * priceOf(a.currency),
    0
  );
  const futuresUsd = Number(futures?.total ?? 0);
  const deliveryUsd = Number(delivery?.total ?? 0);

  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotals: BalanceSubtotal[] = [
    { type: "spot", usd: round(spotUsd) },
    { type: "spot-margin", usd: round(marginUsd) },
    { type: "futures", usd: round(futuresUsd) },
    { type: "delivery", usd: round(deliveryUsd) },
  ];
  return { totalValue: round(spotUsd + marginUsd + futuresUsd + deliveryUsd), typeSubtotals: subtotals };
}
