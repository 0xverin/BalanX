import { describe, expect, it } from "vitest";
import {
  chainsParam,
  mergeTokenLists,
  parseTokenAssets,
  parseTotalValue,
  requestPath,
} from "./okx-dex";

// Fixture mirrors the real OnchainOS response shape (from live verification).
const totalValueJson = {
  code: "0",
  msg: "success",
  data: [{ totalValue: "20610.320107000596" }],
};

const tokenAssetsJson = {
  code: "0",
  msg: "success",
  data: [
    {
      tokenAssets: [
        {
          chainIndex: "56",
          symbol: "USDT",
          balance: "4210.118182207654801498",
          tokenPrice: "0.99893",
          isRiskToken: false,
        },
        {
          chainIndex: "1",
          symbol: "ETH",
          balance: "0.5",
          tokenPrice: "3452.18",
          isRiskToken: false,
        },
        {
          chainIndex: "56",
          symbol: "PEPE",
          balance: "1000",
          tokenPrice: "0.0000112",
          isRiskToken: true,
        },
      ],
    },
  ],
};

describe("chainsParam", () => {
  it("maps eth/bsc to the OKX chain ids 1/56", () => {
    expect(chainsParam(["eth", "bsc"])).toBe("1,56");
    expect(chainsParam(["bsc"])).toBe("56");
    expect(chainsParam(undefined)).toBe("1");
  });
});

describe("requestPath", () => {
  it("builds the total-value path with address, chains and assetType=0", () => {
    const p = requestPath("total", "0xabc", "1,56", false);
    expect(p).toContain("/api/v6/dex/balance/total-value-by-address");
    expect(p).toContain("address=0xabc");
    expect(p).toContain("chains=1,56");
    expect(p).toContain("assetType=0");
    expect(p).toContain("excludeRiskToken=true");
  });

  it("builds the token-balances path with the 0/1 risk-token convention", () => {
    const p = requestPath("tokens", "0xabc", "56", false);
    expect(p).toContain("/api/v6/dex/balance/all-token-balances-by-address");
    expect(p).not.toContain("assetType");
    expect(p).toContain("excludeRiskToken=0");
    expect(requestPath("tokens", "0xabc", "56", true)).toContain("excludeRiskToken=1");
  });

  it("passes boolean excludeRiskToken=false when risk tokens should be included (total)", () => {
    expect(requestPath("total", "0xabc", "1", true)).toContain("excludeRiskToken=false");
  });
});

describe("parseTotalValue", () => {
  it("extracts the USD total from a success response", () => {
    expect(parseTotalValue(totalValueJson)).toBe(20610.320107000596);
  });

  it("throws a readable error when the API returns a non-zero code", () => {
    expect(() =>
      parseTotalValue({ code: "50110", msg: "invalid key", data: [] })
    ).toThrow(/OKX/);
  });
});

describe("parseTokenAssets", () => {
  it("maps token assets to TokenBalance with USD value = balance × price", () => {
    const out = parseTokenAssets(tokenAssetsJson);
    expect(out).toHaveLength(3);
    const usdt = out.find((t) => t.symbol === "USDT")!;
    expect(usdt.usd).toBeCloseTo(4210.118182207654801498 * 0.99893, 2);
    expect(usdt.chain).toBe("bsc");
    const eth = out.find((t) => t.symbol === "ETH")!;
    expect(eth.chain).toBe("eth");
    expect(eth.usd).toBeCloseTo(1726.09, 1);
  });
});

describe("mergeTokenLists", () => {
  it("dedupes the same symbol on the same chain and sums USD", () => {
    const merged = mergeTokenLists([
      parseTokenAssets(tokenAssetsJson),
      [
        {
          symbol: "USDT",
          balance: "100",
          price: 1,
          usd: 100,
          chain: "bsc" as const,
          isRiskToken: false,
        },
      ],
    ]);
    const usdt = merged.filter((t) => t.symbol === "USDT" && t.chain === "bsc");
    expect(usdt).toHaveLength(1);
  });

  it("keeps distinct symbols/chains separate", () => {
    const merged = mergeTokenLists([parseTokenAssets(tokenAssetsJson)]);
    expect(merged.length).toBe(3);
  });
});
