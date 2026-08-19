// Hyperliquid adapter — public API by wallet address, NO credentials
// (CORS verified). Spot clearinghouse + perp clearinghouse.

import type { Account, BalanceSubtotal } from "@/lib/types";
import type { BalanceResult } from "@/lib/portfolio";

const INFO = "https://api.hyperliquid.xyz/info";

interface SpotBalance {
  coin: string;
  total: string;
  hold?: string;
  usdValue?: string;
}

interface PerpState {
  marginSummary?: { accountValue?: string };
  crossMarginSummary?: { accountValue?: string };
}

async function info<T>(body: unknown): Promise<T> {
  const res = await fetch(INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok || (json as { error?: string }).error) {
    throw new Error(`Hyperliquid ${res.status}: ${(json as { error?: string }).error ?? ""}`);
  }
  return json;
}

/** Fetch real Hyperliquid balances for a wallet address: spot + perps. */
export async function hyperliquidFetchBalance(account: Account): Promise<BalanceResult> {
  const address = account.wallets?.[0]?.address;
  if (!address) throw new Error("No wallet address on this account");

  const [spotState, perpState] = await Promise.all([
    info<{ balances?: SpotBalance[] }>({ type: "spotClearinghouseState", user: address }),
    info<PerpState>({ type: "clearinghouseState", user: address }),
  ]);

  const spotUsd = (spotState.balances ?? []).reduce(
    (s, b) => s + Number(b.usdValue ?? Number(b.total) ?? 0),
    0
  );
  const perpsUsd = Number(perpState.marginSummary?.accountValue ?? perpState.crossMarginSummary?.accountValue ?? 0);

  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotals: BalanceSubtotal[] = [
    { type: "spot", usd: round(spotUsd) },
    { type: "perps", usd: round(perpsUsd) },
  ];
  return { totalValue: round(spotUsd + perpsUsd), typeSubtotals: subtotals };
}
