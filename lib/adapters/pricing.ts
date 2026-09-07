// Unified pricing (spec: Q5=A) — one price resolver for every platform.
// Binance batch ticker (browser-direct, CORS *) with BTC-pair fallback, then
// OKX v5 market ticker for anything still missing. DEX accounts get prices
// from the OKX token response instead of this module.
//
// Performance (confirmed with user, 2026-08-19): NO cross-refresh price cache —
// every refresh reads fresh, current prices. Within one refresh the resolver is
// fully parallel with per-asset in-flight dedup (the same asset is priced once
// even when several accounts hold it), and every hop carries a timeout so a
// single stuck endpoint can't stall the refresh.

const STABLES = new Set([
  "USDT", "USDC", "FDUSD", "TUSD", "BUSD", "DAI", "USDP", "USD1", "EUR", "USDE", "PYUSD",
]);

const BINANCE = "https://api.binance.com";

/** Concurrency cap for per-asset fan-out (keeps polite to public endpoints). */
const PRICE_CONCURRENCY = 8;
/** Per-hop timeout — measured single-hop latency is 100ms–1.5s with odd 9s spikes. */
const HOP_TIMEOUT_MS = 6000;

async function binanceGet(path: string): Promise<unknown> {
  const res = await fetch(`${BINANCE}${path}`, {
    signal: AbortSignal.timeout(HOP_TIMEOUT_MS),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  return json;
}

const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/** Run tasks with a concurrency cap; results in input order. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * In-flight dedup — concurrent lookups of the same key share ONE fetch.
 * The promise is removed once settled, so this is strictly within-refresh
 * (or overlapping-refresh) coalescing, never a price cache.
 */
const inflight = new Map<string, Promise<unknown>>();
async function deduped<T>(key: string, make: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = make().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

/**
 * USD price for each requested asset. Stables are 1; anything unpriced is
 * omitted from the result (callers treat as 0 / skip).
 */
export async function fetchUsdPrices(assets: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  for (const s of STABLES) prices[s] = 1;

  const need = [...new Set(assets)].filter((a) => !STABLES.has(a));
  if (need.length === 0) return prices;

  const missing = new Set<string>(need);

  // 1) Binance USDT pairs (batch per ≤100 chunk, chunks in parallel). A batch
  //    400s if ANY symbol is unknown — fall back to parallel per-symbol singles
  //    (deduped), not a serial storm.
  await mapLimit(chunk(need, 100), 4, async (c) => {
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
      await mapLimit(c, PRICE_CONCURRENCY, async (a) => {
        const p = await deduped(`b:${a}`, async () => {
          try {
            const r = (await binanceGet(`/api/v3/ticker/price?symbol=${a}USDT`)) as {
              price?: string;
            };
            return typeof r.price === "string" ? +r.price : null;
          } catch {
            return null;
          }
        });
        if (p !== null) {
          prices[a] = p;
          missing.delete(a);
        }
      });
    }
  });

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
    if (btcUsd > 0) {
      await mapLimit(chunk(btcNeed, 100), 4, async (c) => {
        try {
          const symbols = JSON.stringify(c.map((a) => `${a}BTC`));
          const rows = (await binanceGet(
            `/api/v3/ticker/price?symbols=${encodeURIComponent(symbols)}`
          )) as Array<{ symbol: string; price: string }>;
          for (const r of rows) {
            const asset = r.symbol.replace(/BTC$/, "");
            prices[asset] = +r.price * btcUsd;
            missing.delete(asset);
          }
        } catch {
          await mapLimit(c, PRICE_CONCURRENCY, async (a) => {
            const p = await deduped(`bc:${a}`, async () => {
              try {
                const r = (await binanceGet(`/api/v3/ticker/price?symbol=${a}BTC`)) as {
                  price?: string;
                };
                return typeof r.price === "string" ? +r.price * btcUsd : null;
              } catch {
                return null;
              }
            });
            if (p !== null) {
              prices[a] = p;
              missing.delete(a);
            }
          });
        }
      });
    }
  }

  // 3) Multi-platform public tickers for anything still missing (coins only
  //    listed on one exchange, e.g. BTW on Bitget). Per-asset candidates run
  //    in parallel — one hop's latency, not a chain — and the same asset is
  //    only ever fetched once per refresh.
  await mapLimit([...missing], PRICE_CONCURRENCY, async (a) => {
    const p = await publicPrice(a);
    if (p !== null) prices[a] = p;
  });

  return prices;
}

interface Candidate {
  url: (asset: string) => string;
  last: (json: unknown) => number | null;
}

const CANDIDATES: Candidate[] = [
  // OKX v5 spot
  {
    url: (a) => `https://www.okx.com/api/v5/market/ticker?instId=${a}-USDT`,
    last: (j) => Number((j as { data?: Array<{ last?: string }> })?.data?.[0]?.last),
  },
  // Bybit v5 spot
  {
    url: (a) => `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${a}USDT`,
    last: (j) =>
      Number((j as { result?: { list?: Array<{ lastPrice?: string }> } })?.result?.list?.[0]?.lastPrice),
  },
  // Gate v4 spot
  {
    url: (a) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${a}_USDT`,
    last: (j) => Number((j as Array<{ last?: string }>)?.[0]?.last),
  },
  // KuCoin v2 spot
  {
    url: (a) => `https://api.kucoin.com/api/v2/market/orderbook/level1?symbol=${a}-USDT`,
    last: (j) => Number((j as { data?: { price?: string } })?.data?.price),
  },
  // Bitget v2 spot
  {
    url: (a) => `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${a.toUpperCase()}USDT`,
    last: (j) => Number((j as { data?: Array<{ lastPr?: string }> })?.data?.[0]?.lastPr),
  },
];

/**
 * Try public spot tickers across several exchanges for a single asset.
 * Sources are probed in parallel (deduped in-flight per asset), the first
 * non-zero price wins.
 */
async function publicPrice(asset: string): Promise<number | null> {
  return deduped(`p:${asset}`, async () => {
    const settled = await Promise.all(
      CANDIDATES.map(async (c) => {
        try {
          const res = await fetch(c.url(asset), {
            signal: AbortSignal.timeout(HOP_TIMEOUT_MS),
          });
          if (!res.ok) return null;
          const v = Number(c.last(await res.json()));
          return v > 0 ? v : null;
        } catch {
          return null; // timeout / network — try next source
        }
      })
    );
    return settled.find((v): v is number => v !== null) ?? null;
  });
}

// ── Own-exchange pricing (rule: price an asset using the exchange it's on) ──
// Each CEX adapter prices its own holdings via that platform's public spot
// ticker first (covers exchange-exclusive tokens like BTW on Bitget), with the
// generic Binance/multi-source fallback for anything the platform doesn't list.

export type OwnPlatform = "bybit" | "gate" | "kucoin" | "bitget";

interface OwnTicker {
  url: (asset: string) => string;
  last: (json: unknown) => number | null;
}

export const OWN_TICKERS: Record<OwnPlatform, OwnTicker> = {
  bybit: {
    url: (a) => `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${a}USDT`,
    last: (j) =>
      Number((j as { result?: { list?: Array<{ lastPrice?: string }> } })?.result?.list?.[0]?.lastPrice) || null,
  },
  gate: {
    url: (a) => `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${a}_USDT`,
    last: (j) => Number((j as Array<{ last?: string }>)?.[0]?.last) || null,
  },
  kucoin: {
    url: (a) => `https://api.kucoin.com/api/v2/market/orderbook/level1?symbol=${a}-USDT`,
    last: (j) => Number((j as { data?: { price?: string } })?.data?.price) || null,
  },
  bitget: {
    url: (a) => `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${a.toUpperCase()}USDT`,
    last: (j) => Number((j as { data?: Array<{ lastPr?: string }> })?.data?.[0]?.lastPr) || null,
  },
};

/**
 * Fill prices for the given assets using a platform's own public spot ticker.
 * Parallel per-asset, deduped in-flight (never a cross-refresh cache).
 */
export async function fillOwnPrices(
  prices: Record<string, number>,
  assets: string[],
  own: OwnPlatform
): Promise<void> {
  const t = OWN_TICKERS[own];
  await mapLimit(assets, PRICE_CONCURRENCY, async (a) => {
    if (prices[a]) return; // already priced
    const v = await deduped(`o:${own}:${a}`, async () => {
      try {
        const res = await fetch(t.url(a), { signal: AbortSignal.timeout(HOP_TIMEOUT_MS) });
        if (!res.ok) return null;
        const x = t.last(await res.json());
        return x !== null && x > 0 ? x : null;
      } catch {
        return null; // generic fallback below
      }
    });
    if (v !== null && !prices[a]) prices[a] = v;
  });
}