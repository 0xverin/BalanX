// Gate v4 adapter — browser-signed via the stateless relay (CORS blocked).
//
// Signature (v4): hex(HMAC-SHA512(secret, signString)) where
//   signString = METHOD + "\n" + path + "\n" + query + "\n"
//              + SHA512hex(body) + "\n" + timestamp
// Timestamp is in SECONDS. The newlines and the body hash are mandatory even
// for an empty GET body — Gate answers 401 INVALID_SIGNATURE without them
// (verified against the live API).
//
// Balance source: GET /api/v4/wallet/total_balance — one call returning Gate's
// own USDT estimate for EVERY wallet (spot / margin / cross_margin / futures /
// delivery / finance / quant / options / …), so the whole account is counted
// and no client-side pricing is needed (exchange-only tokens included).

import type { Account, BalanceCategory, BalanceSubtotal, Credential } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";
import { relayBase } from "./relay";

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

async function sha512Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gate v4 sign string — pure, unit-tested: the newlines and the payload hash
 * are part of the contract, not formatting.
 */
export function gateSignString(
  method: string,
  path: string,
  query: string,
  payloadHash: string,
  timestamp: string
): string {
  return `${method}\n${path}\n${query}\n${payloadHash}\n${timestamp}`;
}

async function signedGet(cred: Credential, path: string, query = ""): Promise<unknown> {
  const timestamp = String(Math.floor(Date.now() / 1000)); // Gate wants seconds
  const payloadHash = await sha512Hex(""); // GET ⇒ empty body
  const sign = await hmacHex(
    cred.secretKey,
    gateSignString("GET", path, query, payloadHash, timestamp)
  );
  const res = await fetch(`${relayBase()}/api/exchange-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "signed",
      platform: "gate",
      host: HOST,
      method: "GET",
      path,
      qs: query,
      headers: { KEY: cred.apiKey, Timestamp: timestamp, SIGN: sign },
    }),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body — surfaced through the error branch below */
  }
  if (!res.ok) {
    const j = json as { label?: string; message?: string } | null;
    const msg = j?.label ?? j?.message ?? text.slice(0, 120) ?? res.statusText;
    throw new Error(`Gate ${res.status}: ${msg}`);
  }
  return json;
}

/** `/wallet/total_balance` shape (docs: TotalBalance / AccountBalance). */
export interface GateWalletAmount {
  currency?: string;
  amount?: string;
  borrowed?: string;
  unrealised_pnl?: string;
}

export interface GateTotalBalance {
  total?: GateWalletAmount;
  details?: Record<string, GateWalletAmount>;
}

/** Gate wallet → BalanX category. Unmapped wallets (quant/options/cfd/…) still count in the total. */
const WALLET_CATEGORY: Record<string, BalanceCategory> = {
  spot: "spot",
  margin: "spot-margin",
  cross_margin: "spot-margin",
  futures: "futures",
  delivery: "delivery",
  finance: "earn", // 余币宝 / 理财
};

/** Rows always rendered — the platform's declared scope (see lib/platforms.ts). */
const ALWAYS_SHOWN: BalanceCategory[] = ["spot", "spot-margin", "futures", "delivery"];
/** Extra rows added only when they hold something (e.g. finance → 理财). */
const WHEN_FUNDED: BalanceCategory[] = ["earn"];

const amount = (w?: GateWalletAmount): number => {
  const n = Number(w?.amount ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Aggregate `/wallet/total_balance` (pure seam). Gate already values every
 * wallet in USDT, so there is no pricing step: `amount` is Gate's own
 * per-wallet estimate and is used verbatim — `borrowed` and `unrealised_pnl`
 * are reported alongside it for reference only (futures `amount` is equity).
 * `total.amount` is Gate's account-wide figure and wins over our own sum.
 */
export function aggregateGate(tb: GateTotalBalance): {
  totalValue: number;
  typeSubtotals: BalanceSubtotal[];
} {
  const details = tb.details ?? {};
  const byCategory = new Map<BalanceCategory, number>();
  for (const [wallet, w] of Object.entries(details)) {
    const cat = WALLET_CATEGORY[wallet];
    if (!cat) continue;
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + amount(w));
  }

  const typeSubtotals: BalanceSubtotal[] = [
    ...ALWAYS_SHOWN,
    ...WHEN_FUNDED.filter((c) => (byCategory.get(c) ?? 0) !== 0),
  ].map((type) => ({ type, usd: round(byCategory.get(type) ?? 0) }));

  const gateTotal = Number(tb.total?.amount);
  const allWallets = Object.values(details).reduce((s, w) => s + amount(w), 0);
  return { totalValue: round(Number.isFinite(gateTotal) ? gateTotal : allWallets), typeSubtotals };
}

/** Fetch real Gate balances: every wallet via one USDT-valued summary call. */
export async function gateFetchBalance(account: Account): Promise<BalanceResult> {
  const cred = account.credentials as Credential | undefined;
  if (!cred) throw new Error("Missing Gate credentials");

  // Errors propagate: a rejected key must surface as a readable account error,
  // never as a silent $0 (the relay returns Gate's own label/message).
  const tb = (await signedGet(cred, "/api/v4/wallet/total_balance")) as GateTotalBalance;
  return aggregateGate(tb);
}
