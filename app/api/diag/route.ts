// Diagnostics: report the relay's outbound IP and whether Binance geo-eligibility
// allows it. Helps debug "Service unavailable from a restricted location".

import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  let ip = "unknown";
  try {
    const r = (await (await fetch("https://api64.ipify.org?format=json")).json()) as {
      ip?: string;
    };
    ip = r.ip ?? "unknown";
  } catch {
    /* ignore */
  }

  let binance = "unknown";
  try {
    const res = await fetch("https://api.binance.com/api/v3/time");
    binance = String(res.status);
  } catch (e) {
    binance = `err:${String(e instanceof Error ? e.message : e).slice(0, 60)}`;
  }

  return NextResponse.json({
    ip,
    binanceTimeStatus: binance,
    note: "binance 200 = eligible; 451/0 = geo-blocked for this relay's outbound IP",
  });
}
