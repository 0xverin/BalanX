import { describe, expect, it } from "vitest";
import { isAllowedRelay } from "@/app/api/binance-proxy/route";

const relay = (over: Partial<Parameters<typeof isAllowedRelay>[0]> = {}) => ({
  host: "api.binance.com",
  method: "GET",
  path: "/api/v3/account",
  qs: "timestamp=1&signature=abc",
  apiKey: "k",
  ...over,
});

describe("isAllowedRelay", () => {
  it("allows the eight signed endpoints we use", () => {
    const paths = [
      "/api/v3/account",
      "/sapi/v1/asset/get-funding-asset",
      "/sapi/v1/margin/account",
      "/sapi/v1/margin/isolated/account",
      "/sapi/v1/simple-earn/flexible/position",
      "/sapi/v1/simple-earn/locked/position",
      "/fapi/v2/balance",
      "/dapi/v1/balance",
    ];
    for (const p of paths) {
      expect(isAllowedRelay(relay({ path: p }))).toBe(true);
    }
  });

  it("allows POST for the funding wallet endpoint", () => {
    expect(
      isAllowedRelay(relay({ method: "POST", path: "/sapi/v1/asset/get-funding-asset" }))
    ).toBe(true);
  });

  it("blocks unknown hosts, methods, and paths (SSRF guard)", () => {
    expect(isAllowedRelay(relay({ host: "evil.example.com" }))).toBe(false);
    expect(isAllowedRelay(relay({ host: "api.binance.com.evil.com" }))).toBe(false);
    expect(isAllowedRelay(relay({ method: "DELETE" }))).toBe(false);
    expect(isAllowedRelay(relay({ path: "/api/v3/withdraw" }))).toBe(false);
    expect(isAllowedRelay(relay({ path: "/" }))).toBe(false);
    expect(isAllowedRelay(relay({ path: "/api/v3/account/../secret" }))).toBe(false);
  });

  it("blocks empty host/path", () => {
    expect(isAllowedRelay(relay({ host: "" }))).toBe(false);
    expect(isAllowedRelay(relay({ path: "" }))).toBe(false);
  });

  it("rejects malformed bodies without throwing (no 500s)", () => {
    expect(isAllowedRelay({} as Parameters<typeof isAllowedRelay>[0])).toBe(false);
    expect(isAllowedRelay(null as unknown as Parameters<typeof isAllowedRelay>[0])).toBe(false);
  });
});
