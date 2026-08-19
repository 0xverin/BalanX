// Unified pricing (spec: Q5=A) — one price resolver for every platform.
// Binance batch ticker (browser-direct, CORS *) with BTC-pair fallback, then
// OKX v5 market ticker for anything still missing. DEX accounts get prices
// from the OKX token response instead of this module.

const STABLES = new Set([
  "USDT", "USDC", "FDUSD", "TUSD", "BUSD", "DAI", "USDP", "USD1", "EUR", "USDE", "PYUSD",
]);

const BINANCE = "https://api.binance.com";

async function binanceGet(path: string): Promise<unknown> {
  const res = await fetch(`${BINANCE}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  return json;
}

async function okxTicker(symbol: string): Promise<number | null> {
  const res = await fetch(
    `https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(symbol)}`
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { code?: string; data?: Array<{ last?: string }> };
  if (json.code !== "0" || !json.data?.length) return null;
  const last = Number(json.data[0].last);
  return Number.isFinite(last) ? last : null;
}

const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/**
 * USD price for each requested asset. Stables are 1; anything unpriced is
 * omitted from the result (callers treat as 0 / skip).
 */
export async function fetchUsdPrices(assets: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  for (const s of STABLES) prices[s] = 1;

  const need = [...new Set(assets)].filter((a) => !STABLES.has(a));
  if (need.length === 0) return prices;

  // 1) Binance USDT pairs (batch)
  const missing = new Set<string>(need);
  for (const c of chunk(need, 100)) {
    try {
      const symbols = JSON.stringify(c.map((a) => `${a}USDT`));
      const rows = (await binanceGet(
        `/api/v3/ticker/price?symbols=${encodeURIComponent(symbols)}`
      )) as Array<{ symbol: string; price: string }>;
      for (const r of rows) {
        const asset = r.symbol.replace(/USDT$/, "");
        prices[asset] = +r.price;
        missing.delete(asset);
      }
    } catch {
      // batch poisoned by an odd dust symbol → per-symbol
      for (const a of c) {
        try {
          const r = (await binanceGet(
            `/api/v3/ticker/price?symbol=${a}USDT`
          )) as { price: string };
          if (typeof r.price === "string") {
            prices[a] = +r.price;
            missing.delete(a);
          }
        } catch {
          /* skip */
        }
      }
    }
  }

  // 2) Binance BTC pairs for still-missing assets
  const btcNeed = [...missing];
  if (btcNeed.length > 0) {
    let btcUsd = 0;
    try {
      const btc = (await binanceGet("/api/v3/ticker/price?symbol=BTCUSDT")) as {
        price: string;
      };
      btcUsd = +btc.price;
    } catch {
      /* skip */
    }
    for (const c of chunk(btcNeed, 100)) {
      try {
        const symbols = JSON.stringify(c.map((a) => `${a}BTC`));
        const rows = (await binanceGet(
          `/api/v3/ticker/price?symbols=${encodeURIComponent(symbols)}`
        )) as Array<{ symbol: string; price: string }>;
        for (const r of rows) {
          const asset = r.symbol.replace(/BTC$/, "");
          if (btcUsd > 0) {
            prices[asset] = +r.price * btcUsd;
            missing.delete(asset);
          }
        }
      } catch {
        /* skip */
      }
    }
  }

  // 3) OKX v5 ticker for anything still missing
  for (const a of missing) {
    const price = await okxTicker(`${a}-USDT`);
    if (price !== null) prices[a] = price;
  }

  return prices;
}
