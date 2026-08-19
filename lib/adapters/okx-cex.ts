// OKX CEX adapter — v5 API, browser-direct (CORS verified).
// Same 3-credential signing scheme as OKX Dex. Balance by accountType:
// spot / funding / trading / unified (each call returns USD equity per ccy).

import type { Account, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";

const BASE = "https://www.okx.com";

const ACCOUNT_TYPES = ["spot", "funding", "trading", "unified"] as const;

async function sign(cred: Credential, method: string, path: string, timestamp: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cred.secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}${method}${path}`));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function accountBalance(cred: Credential, accountType: string): Promise<number> {
  const path = `/api/v5/account/balance?accountType=${accountType}`;
  const timestamp = new Date().toISOString();
  const okSign = await sign(cred, "GET", path, timestamp);
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "OK-ACCESS-KEY": cred.apiKey,
      "OK-ACCESS-SIGN": okSign,
      "OK-ACCESS-PASSPHRASE": cred.passphrase ?? "",
      "OK-ACCESS-TIMESTAMP": timestamp,
    },
  });
  const json = (await res.json()) as {
    code?: string;
    msg?: string;
    data?: Array<{ details?: Array<{ eq?: string }> }>;
  };
  if (!res.ok || json.code !== "0") {
    throw new Error(`OKX ${json.code ?? res.status}: ${json.msg ?? ""}`);
  }
  // OKX v5 returns per-currency USD equity (eq) — sum across currencies
  const details = json.data?.[0]?.details ?? [];
  return details.reduce((s, d) => s + Number(d.eq ?? 0), 0);
}

/** Fetch real OKX CEX balances: spot / funding / trading(+unified as futures). */
export async function okxCexFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing OKX credentials");

  const [spot, funding, trading, unified] = await Promise.all(
    ACCOUNT_TYPES.map((t) => accountBalance(cred, t))
  );

  const subtotals: BalanceSubtotal[] = [
    { type: "spot", usd: spot },
    { type: "funding", usd: funding },
    { type: "futures", usd: trading + unified },
  ];
  const totalValue = spot + funding + trading + unified;
  return { totalValue, typeSubtotals: subtotals };
}
