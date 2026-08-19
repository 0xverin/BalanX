import { describe, expect, it } from "vitest";
import { aggregateBitget, type SpotRow } from "./bitget";

const spot: SpotRow[] = [
  { coin: "USDT", available: "100", frozen: "0" },
  { coin: "BTC", available: "0.1", frozen: "0" },
];

const priceOf = (c: string) => (c === "USDT" || c === "USDC" ? 1 : c === "BTC" ? 60000 : 0);

describe("aggregateBitget", () => {
  it("sums spot + all futures product types (USDT-M/USDC-M/COIN-M)", () => {
    const out = aggregateBitget(
      spot,
      {
        umcbl: [{ coin: "USDT", equity: "500", usdtEquity: "500" }],
        dmcbl: [{ coin: "BTC", equity: "0.01" }], // coin-M → equity × price
      },
      priceOf
    );
    expect(out.typeSubtotals.find((t) => t.type === "spot")?.usd).toBeCloseTo(6100, 0);
    expect(out.typeSubtotals.find((t) => t.type === "futures")?.usd).toBeCloseTo(500 + 600, 0);
    expect(out.totalValue).toBeCloseTo(6100 + 1100, 0);
  });

  it("handles accounts with no futures (all empty)", () => {
    const out = aggregateBitget(spot, { umcbl: [], dmcbl: [] }, priceOf);
    expect(out.totalValue).toBeCloseTo(6100, 0);
    expect(out.typeSubtotals.find((t) => t.type === "futures")?.usd).toBe(0);
  });
});
