// Stateless Binance relay (ADR-0001 exception, user-approved 2026-08-18).
//
// Binance's CORS rejects browser signed calls (preflight 400/401 without
// Access-Control-Allow-Headers), so signed requests go through this thin
// serverless function. It forwards ONLY allowlisted Binance endpoints,
// stores nothing, and never sees the secret key — the HMAC signature is
// computed in the browser, so the secret never leaves the client.

import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "api.binance.com",
  "fapi.binance.com",
  "dapi.binance.com",
]);

// SSRF guard: only the endpoints this app uses may be relayed.
const ALLOWED_PATHS = [
  "/api/v3/account",
  "/sapi/v1/asset/get-funding-asset",
  "/sapi/v1/margin/account",
  "/sapi/v1/margin/isolated/account",
  "/sapi/v1/simple-earn/flexible/position",
  "/sapi/v1/simple-earn/locked/position",
  "/fapi/v2/balance",
  "/dapi/v1/balance",
];

interface RelayRequest {
  host: string;
  method: string;
  path: string;
  /** the full signed query string (timestamp=..&signature=..) built in the browser */
  qs: string;
  apiKey: string;
}

/** Pure allowlist check — unit-tested. */
export function isAllowedRelay(r: RelayRequest): boolean {
  if (
    typeof r !== "object" ||
    r === null ||
    typeof r.host !== "string" ||
    typeof r.path !== "string" ||
    typeof r.method !== "string"
  ) {
    return false;
  }
  const path = r.path;
  // normalize-resistance: forbid traversal outright
  if (path.includes("..")) return false;
  return (
    ALLOWED_HOSTS.has(r.host) &&
    (r.method === "GET" || r.method === "POST") &&
    ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + "/"))
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: RelayRequest;
  try {
    body = (await request.json()) as RelayRequest;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!isAllowedRelay(body)) {
    return NextResponse.json({ error: "relay blocked" }, { status: 403 });
  }

  const upstream = await fetch(`https://${body.host}${body.path}?${body.qs}`, {
    method: body.method,
    headers: { "X-MBX-APIKEY": body.apiKey, "Content-Type": "application/json" },
  });
  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
