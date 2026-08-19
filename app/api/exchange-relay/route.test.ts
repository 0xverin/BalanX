import { describe, expect, it } from "vitest";
import {
  isAllowedServerSigned,
  isAllowedSigned,
  type RelayPlatform,
  type ServerSignedRelay,
  type SignedRelay,
} from "@/app/api/exchange-relay/route";

const signed = (over: Partial<SignedRelay> = {}): SignedRelay => ({
  mode: "signed",
  platform: "binance",
  host: "api.binance.com",
  method: "GET",
  path: "/api/v3/account",
  qs: "timestamp=1&signature=abc",
  headers: { "X-MBX-APIKEY": "k" },
  ...over,
});

const serverSigned = (over: Partial<ServerSignedRelay> = {}): ServerSignedRelay => ({
  mode: "server-signed",
  platform: "okx-dex",
  method: "GET",
  path: "/api/v6/dex/balance/total-value-by-address?address=0x1&chains=1",
  ...over,
});

describe("isAllowedSigned", () => {
  it("allows the configured endpoints for each relay platform", () => {
    const ok: Array<[Exclude<RelayPlatform, "okx-dex">, string, string]> = [
      ["binance", "api.binance.com", "/api/v3/account"],
      ["binance", "fapi.binance.com", "/fapi/v2/balance"],
      ["gate", "api.gateio.ws", "/api/v4/spot/accounts"],
      ["gate", "api.gateio.ws", "/api/v4/futures/usdt/accounts"],
      ["bitget", "api.bitget.com", "/api/v2/spot/account/assets"],
      ["bitget", "api.bitget.com", "/api/v2/mix/account/accounts"],
      ["bitget", "api.bitget.com", "/api/v2/spot/market/ticker"],
      ["kucoin", "api.kucoin.com", "/api/v2/accounts"],
      ["kucoin", "api.kucoin.com", "/api/v1/margin/account"],
    ];
    for (const [platform, host, path] of ok) {
      expect(isAllowedSigned(signed({ platform, host, path }))).toBe(true);
    }
  });

  it("blocks wrong hosts, unknown paths, traversal and malformed bodies", () => {
    expect(isAllowedSigned(signed({ host: "evil.example.com" }))).toBe(false);
    expect(isAllowedSigned(signed({ path: "/api/v3/withdraw" }))).toBe(false);
    expect(isAllowedSigned(signed({ path: "/api/v3/account/../secret" }))).toBe(false);
    expect(isAllowedSigned(signed({ method: "DELETE" }))).toBe(false);
    expect(isAllowedSigned({} as SignedRelay)).toBe(false);
    expect(isAllowedSigned(null as unknown as SignedRelay)).toBe(false);
  });
});

describe("isAllowedServerSigned (okx-dex)", () => {
  it("allows the OKX Dex balance endpoints", () => {
    expect(
      isAllowedServerSigned(
        serverSigned({ path: "/api/v6/dex/balance/all-token-balances-by-address?address=0x1&chains=1" })
      )
    ).toBe(true);
  });

  it("blocks other paths, wrong platforms and malformed bodies", () => {
    expect(isAllowedServerSigned(serverSigned({ path: "/api/v5/account/balance" }))).toBe(false);
    expect(isAllowedServerSigned(serverSigned({ platform: "binance" as never }))).toBe(false);
    expect(isAllowedServerSigned({} as ServerSignedRelay)).toBe(false);
    expect(isAllowedServerSigned(null as unknown as ServerSignedRelay)).toBe(false);
  });
});
