import { describe, expect, it } from "vitest";
import { aggregateGate, gateSignString, type GateTotalBalance } from "./gate";

const sha512Hex = async (s: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Regression guard: Gate v4 signs METHOD\nPATH\nQUERY\nSHA512(body)\nTIMESTAMP.
// The first implementation omitted the newlines and the body hash, so every
// signed call came back 401 INVALID_SIGNATURE and the account showed $0.
describe("gateSignString", () => {
  it("joins method/path/query/body-hash/timestamp with newlines", async () => {
    const emptyBodyHash = await sha512Hex("");
    expect(emptyBodyHash).toBe(
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce4" +
        "7d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
    );

    const sign = gateSignString("GET", "/api/v4/wallet/total_balance", "", emptyBodyHash, "1700000000");
    expect(sign).toBe(`GET\n/api/v4/wallet/total_balance\n\n${emptyBodyHash}\n1700000000`);
    expect(sign.split("\n")).toHaveLength(5);
  });

  it("carries the query string as its own field", async () => {
    const hash = await sha512Hex("");
    expect(gateSignString("GET", "/api/v4/spot/tickers", "currency_pair=BTC_USDT", hash, "1")).toBe(
      `GET\n/api/v4/spot/tickers\ncurrency_pair=BTC_USDT\n${hash}\n1`
    );
  });
});

const totalBalance = (details: Record<string, string>, total: string): GateTotalBalance => ({
  total: { currency: "USDT", amount: total },
  details: Object.fromEntries(
    Object.entries(details).map(([k, v]) => [k, { currency: "USDT", amount: v }])
  ),
});

describe("aggregateGate", () => {
  it("uses Gate's account total and maps each wallet onto its category", () => {
    const out = aggregateGate(
      totalBalance({ spot: "1200", margin: "300", futures: "50", delivery: "10" }, "1560")
    );
    expect(out.totalValue).toBe(1560);
    expect(out.typeSubtotals).toEqual([
      { type: "spot", usd: 1200 },
      { type: "spot-margin", usd: 300 },
      { type: "futures", usd: 50 },
      { type: "delivery", usd: 10 },
    ]);
  });

  it("counts wallets without a category (quant/options/…) in the total only", () => {
    const out = aggregateGate(totalBalance({ spot: "100", quant: "7", options: "3" }, "110"));
    expect(out.totalValue).toBe(110);
    expect(out.typeSubtotals.map((s) => s.type)).toEqual([
      "spot",
      "spot-margin",
      "futures",
      "delivery",
    ]);
  });

  it("merges margin + cross_margin and shows finance as earn when funded", () => {
    const out = aggregateGate(
      totalBalance({ margin: "100", cross_margin: "20", finance: "5.5" }, "125.5")
    );
    expect(out.typeSubtotals.find((s) => s.type === "spot-margin")?.usd).toBe(120);
    expect(out.typeSubtotals.find((s) => s.type === "earn")?.usd).toBe(5.5);
  });

  it("hides the earn row when the finance wallet is empty, keeps the declared ones", () => {
    const out = aggregateGate(totalBalance({ spot: "10", finance: "0" }, "10"));
    expect(out.typeSubtotals.map((s) => s.type)).toEqual([
      "spot",
      "spot-margin",
      "futures",
      "delivery",
    ]);
  });

  it("falls back to summing every wallet when the total is missing", () => {
    const out = aggregateGate({
      details: { spot: { amount: "10" }, quant: { amount: "2" } },
    });
    expect(out.totalValue).toBe(12);
  });

  it("survives an empty payload as $0 with zeroed rows", () => {
    const out = aggregateGate({});
    expect(out.totalValue).toBe(0);
    expect(out.typeSubtotals.every((s) => s.usd === 0)).toBe(true);
  });
});
