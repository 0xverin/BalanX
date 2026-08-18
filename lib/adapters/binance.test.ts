import { describe, expect, it } from "vitest";
import {
  aggregateBinance,
  hmacHex,
  signedQuery,
  uniqueAssets,
  type BinanceRaw,
} from "./binance";

// Fixture mirrors the live verification: Binance total ≈ $49,790
// (futures-dominant: balance 51258.06 + unrealized PnL −1468.63).
const raw: BinanceRaw = {
  spot: { balances: [{ asset: "USDC", free: "0.4685647", locked: "0" }] },
  funding: [{ asset: "USDC", free: "0.36122273", locked: "0" }],
  marginCrossNetBtc: "0",
  marginIsolatedNetBtc: "0",
  earnFlex: [],
  earnLocked: [],
  futuresUsdm: [{ asset: "USDT", balance: "51258.05640689", crossUnPnl: "-1468.63375500" }],
  futuresCoinm: [],
};

const priceOf = (a: string) => (a === "USDT" || a === "USDC" ? 1 : 0);

describe("hmacHex", () => {
  it("matches node:crypto HMAC-SHA256 hex (cross-implementation check)", async () => {
    const nodeCrypto = await import("node:crypto");
    const expected = nodeCrypto
      .createHmac("sha256", "secret")
      .update("timestamp=123&symbol=BTCUSDT")
      .digest("hex");
    expect(await hmacHex("secret", "timestamp=123&symbol=BTCUSDT")).toBe(expected);
  });
});

describe("signedQuery", () => {
  it("sorts params, adds timestamp and signature", async () => {
    const qs = await signedQuery("secret", { omitZeroBalances: "true" }, () => 123);
    expect(qs).toContain("omitZeroBalances=true");
    expect(qs).toContain("timestamp=123");
    expect(qs).toContain("signature=");
    // signature covers the exact string before &signature
    const sig = qs.split("signature=")[1];
    const { hmacHex: h } = await import("./binance");
    expect(sig).toBe(await h("secret", "omitZeroBalances=true&timestamp=123"));
  });
});

describe("uniqueAssets", () => {
  it("collects every non-zero asset needing a USD price (USDT-M futures stables excluded)", () => {
    const assets = uniqueAssets(raw);
    expect(assets).toEqual(["USDC"]);
  });

  it("includes COIN-M futures assets which need conversion", () => {
    const withCoinm: BinanceRaw = {
      ...raw,
      futuresCoinm: [{ asset: "BTC", balance: "1", crossUnPnl: "0" }],
    };
    expect(uniqueAssets(withCoinm)).toEqual(["USDC", "BTC"]);
  });

  it("skips zero-balance dust assets (e.g. COIN-M lists 50+ empty rows)", () => {
    const withDust: BinanceRaw = {
      ...raw,
      futuresCoinm: [
        { asset: "USD", balance: "0", crossUnPnl: "0" },
        { asset: "NEAR", balance: "0.00000000", crossUnPnl: "0" },
        { asset: "BTC", balance: "0.5", crossUnPnl: "0" },
      ],
    };
    expect(uniqueAssets(withDust)).toEqual(["USDC", "BTC"]);
  });
});

describe("aggregateBinance", () => {
  it("computes per-type subtotals and total (fixture ≈ 49790)", () => {
    const out = aggregateBinance(raw, priceOf, 64195.88);
    expect(out.typeSubtotals.find((t) => t.type === "spot")?.usd).toBeCloseTo(0.47, 1);
    expect(out.typeSubtotals.find((t) => t.type === "funding")?.usd).toBeCloseTo(0.36, 1);
    const futures = out.typeSubtotals.find((t) => t.type === "futures")!;
    expect(futures.usd).toBeCloseTo(49789.42, 1);
    expect(out.totalValue).toBeCloseTo(49790.25, 1);
  });

  it("includes margin net equity via BTC valuation", () => {
    const withMargin: BinanceRaw = { ...raw, marginCrossNetBtc: "0.05", marginIsolatedNetBtc: "0" };
    const out = aggregateBinance(withMargin, priceOf, 60000);
    expect(out.typeSubtotals.find((t) => t.type === "margin")?.usd).toBeCloseTo(3000, 0);
  });

  it("prices COIN-M futures assets via the price resolver", () => {
    const withCoinm: BinanceRaw = {
      ...raw,
      futuresCoinm: [{ asset: "BTC", balance: "0.05", crossUnPnl: "0" }],
    };
    const out = aggregateBinance(withCoinm, (a) => (a === "BTC" ? 64195.88 : 1), 64195.88);
    expect(out.typeSubtotals.find((t) => t.type === "futures")?.usd).toBeCloseTo(3209.79 + 49789.42, 0);
  });

  it("returns zero subtotals when the account is empty", () => {
    const empty: BinanceRaw = {
      spot: {},
      funding: [],
      marginCrossNetBtc: "0",
      marginIsolatedNetBtc: "0",
      earnFlex: [],
      earnLocked: [],
      futuresUsdm: [],
      futuresCoinm: [],
    };
    const out = aggregateBinance(empty, () => 1, 60000);
    expect(out.totalValue).toBe(0);
  });
});
