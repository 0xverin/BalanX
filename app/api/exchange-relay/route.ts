// Multi-platform stateless relay (ADR-0002 / ADR-0003).
//
// Two modes:
//  - "signed": platforms whose CORS blocks browser calls (Binance / Gate /
//    Bitget / KuCoin) — the browser computes the HMAC signature, the relay
//    forwards the pre-signed request + signature headers verbatim.
//  - "server-signed": OKX Dex — the OnchainOS key lives in server env vars
//    (OKX_DEX_API_KEY / SECRET / PASSPHRASE); the relay signs and forwards.
//
// The relay stores nothing, has no database, and only reaches allowlisted
// hosts/paths. Secrets never pass through it in plaintext form — the browser's
// secret stays in the browser; OKX Dex's secret stays in the server env.

import { NextResponse } from "next/server";

const RELAY = {
  binance: {
    hosts: ["api.binance.com", "fapi.binance.com", "dapi.binance.com"],
    paths: [
      "/api/v3/account",
      "/sapi/v1/asset/get-funding-asset",
      "/sapi/v1/margin/account",
      "/sapi/v1/margin/isolated/account",
      "/sapi/v1/simple-earn/flexible/position",
      "/sapi/v1/simple-earn/locked/position",
      "/fapi/v2/balance",
      "/dapi/v1/balance",
    ],
  },
  gate: {
    hosts: ["api.gateio.ws"],
    paths: [
      "/api/v4/spot/accounts",
      "/api/v4/spot/margin_accounts",
      "/api/v4/futures/usdt/accounts",
      "/api/v4/futures/delivery/accounts",
    ],
  },
  bitget: {
    hosts: ["api.bitget.com"],
    paths: [
      "/api/v2/spot/account/assets",
      "/api/v2/mix/account/accounts",
    ],
  },
  kucoin: {
    hosts: ["api.kucoin.com"],
    paths: [
      "/api/v2/accounts",
      "/api/v1/margin/account",
    ],
  },
} as const;

const DEX_HOST = "web3.okx.com";
const DEX_PATHS = [
  "/api/v6/dex/balance/total-value-by-address",
  "/api/v6/dex/balance/all-token-balances-by-address",
];

export type RelayPlatform = keyof typeof RELAY | "okx-dex";

export interface SignedRelay {
  mode: "signed";
  platform: keyof typeof RELAY;
  host: string;
  method: string;
  path: string;
  qs: string;
  headers: Record<string, string>;
}

export interface ServerSignedRelay {
  mode: "server-signed";
  platform: "okx-dex";
  method: "GET";
  path: string;
}

/** Pure allowlist checks — unit-tested. */
export function isAllowedSigned(r: SignedRelay): boolean {
  if (typeof r !== "object" || r === null) return false;
  if (typeof r.host !== "string" || typeof r.path !== "string" || typeof r.method !== "string")
    return false;
  if (typeof r.qs !== "string" || typeof r.headers !== "object" || r.headers === null)
    return false;
  if (r.path.includes("..")) return false;
  const clean = r.path.split("?")[0];
  const conf = RELAY[r.platform];
  if (!conf || !(conf.hosts as readonly string[]).includes(r.host)) return false;
  if (r.method !== "GET" && r.method !== "POST") return false;
  return conf.paths.some((p) => clean === p || clean.startsWith(p + "/"));
}

export function isAllowedServerSigned(r: ServerSignedRelay): boolean {
  if (typeof r !== "object" || r === null) return false;
  if (r.platform !== "okx-dex" || r.method !== "GET") return false;
  if (typeof r.path !== "string" || r.path.includes("..")) return false;
  const clean = r.path.split("?")[0];
  return DEX_PATHS.some((p) => clean === p || clean.startsWith(p + "/"));
}

function relayError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

async function forward(host: string, method: string, path: string, qs: string, headers: Record<string, string>) {
  const upstream = await fetch(`https://${host}${path}?${qs}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

async function okxSign(secret: string, timestamp: string, method: string, path: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}${method}${path}`));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return relayError(400, "invalid body");
  }

  if (typeof body !== "object" || body === null) return relayError(400, "invalid body");
  const mode = (body as { mode?: unknown }).mode;

  if (mode === "signed") {
    const r = body as SignedRelay;
    if (!isAllowedSigned(r)) return relayError(403, "relay blocked");
    return forward(r.host, r.method, r.path, r.qs, r.headers);
  }

  if (mode === "server-signed") {
    const r = body as ServerSignedRelay;
    if (!isAllowedServerSigned(r)) return relayError(403, "relay blocked");
    const apiKey = process.env.OKX_DEX_API_KEY;
    const secret = process.env.OKX_DEX_SECRET;
    const passphrase = process.env.OKX_DEX_PASSPHRASE;
    if (!apiKey || !secret || !passphrase) {
      return relayError(503, "OKX Dex credentials not configured on the server");
    }
    const timestamp = new Date().toISOString();
    const sign = await okxSign(secret, timestamp, r.method, r.path);
    const upstream = await fetch(`https://${DEX_HOST}${r.path}`, {
      method: r.method,
      headers: {
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": sign,
        "OK-ACCESS-PASSPHRASE": passphrase,
        "OK-ACCESS-TIMESTAMP": timestamp,
      },
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return relayError(400, "unknown mode");
}
