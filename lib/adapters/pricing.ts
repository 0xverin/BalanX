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

  // 3) Multi-platform public tickers for anything still missing (coins only
  //    listed on one exchange, e.g. BTW on Bitget, long-tail on Bybit/Gate/KuCoin)
  for (const a of missing) {
    const price = await publicPrice(a);
    if (price !== null) prices[a] = price;
  }

  return prices;
}

/**
 * Try public spot tickers across several exchanges to price a single asset.
 * Covers tokens a user holds that only their own exchange lists (the generic
 * Binance-first pricing misses those → they'd count as $0 otherwise).
 */
async function publicPrice(asset: string): Promise<number | null> {
  const candidates: Array<{ url: string; last: (j: unknown) => number | null }> = [
    // OKX v5 spot
    {
      url: `https://www.okx.com/api/v5/market/ticker?instId=${asset}-USDT`,
      last: (j) => Number((j as { data?: Array<{ last?: string }> })?.data?.[0]?.last),
    },
    // Bybit v5 spot
    {
      url: `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${asset}USDT`,
      last: (j) =>
        Number((j as { result?: { list?: Array<{ lastPrice?: string }> } })?.result?.list?.[0]?.lastPrice),
    },
    // Gate v4 spot
    {
      url: `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${asset}_USDT`,
      last: (j) => Number((j as Array<{ last?: string }>)?.[0]?.last),
    },
    // KuCoin v2 spot
    {
      url: `https://api.kucoin.com/api/v2/market/orderbook/level1?symbol=${asset}-USDT`,
      last: (j) => Number((j as { data?: { price?: string } })?.data?.price),
    },
    // Bitget v2 spot
    {
      url: `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${asset.toUpperCase()}USDT`,
      last: (j) => Number((j as { data?: Array<{ lastPr?: string }> })?.data?.[0]?.lastPr),
    },
  ];
  for (const c of candidates) {
    try {
      const res = await fetch(c.url);
      if (!res.ok) continue;
      const n = Number(c.last(await res.json()));
      if (n > 0) return n;
    } catch {
      /* try next source */
    }
  }
  return null;
}
