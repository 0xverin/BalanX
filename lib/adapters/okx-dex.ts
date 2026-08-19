// OKX Dex (OnchainOS Balance API) adapter.
// The OnchainOS key lives in server env vars (ADR-0003); requests go through
// the stateless relay which signs server-side. Browser never sees the key.
// Verified live: total ≈ $20.6k for the test wallet.

import type { Account, TokenBalance } from "@/lib/types";
import type { BalanceResult, FetchOptions } from "@/lib/portfolio";
import { relayBase } from "./relay";

/** Account chains → OKX chain ids (ETH=1, BSC=56). */
export function chainsParam(chains: Account["chains"]): string {
  const ids = (chains ?? ["eth"]).map((c) => (c === "eth" ? "1" : "56"));
  return ids.join(",");
}

export function requestPath(
  api: "total" | "tokens",
  address: string,
  chains: string,
  includeRiskTokens: boolean
): string {
  const base =
    api === "total"
      ? "/api/v6/dex/balance/total-value-by-address"
      : "/api/v6/dex/balance/all-token-balances-by-address";
  const q = `address=${encodeURIComponent(address)}&chains=${chains}`;
  const parts = [q];
  if (api === "total") {
    parts.push("assetType=0");
    // total-value expects a Boolean value
    parts.push(`excludeRiskToken=${includeRiskTokens ? "false" : "true"}`);
  } else {
    // token-balances expects 0 (filter out) / 1 (do not filter)
    parts.push(`excludeRiskToken=${includeRiskTokens ? "1" : "0"}`);
  }
  return `${base}?${parts.join("&")}`;
}

interface OkxEnvelope<T> {
  code: string;
  msg: string;
  data: T[];
}

export function parseTotalValue(json: OkxEnvelope<{ totalValue: string }>): number {
  if (json.code !== "0") throw new Error(`OKX ${json.code}: ${json.msg}`);
  return Number(json.data[0]?.totalValue);
}

interface RawToken {
  symbol: string;
  balance: string;
  tokenPrice: string;
  chainIndex: string;
  isRiskToken: boolean;
}

export function parseTokenAssets(
  json: OkxEnvelope<{ tokenAssets: RawToken[] }>
): TokenBalance[] {
  if (json.code !== "0") throw new Error(`OKX ${json.code}: ${json.msg}`);
  return (json.data[0]?.tokenAssets ?? []).map((t) => {
    const price = Number(t.tokenPrice);
    return {
      symbol: t.symbol,
      balance: t.balance,
      price,
      usd: Number(t.balance) * price,
      chain: t.chainIndex === "1" ? "eth" : "bsc",
      isRiskToken: t.isRiskToken,
    };
  });
}

/** Merge per-wallet token lists; same symbol+chain appears once (values summed). */
export function mergeTokenLists(lists: TokenBalance[][]): TokenBalance[] {
  const byKey = new Map<string, TokenBalance>();
  for (const list of lists) {
    for (const t of list) {
      const key = `${t.chain}:${t.symbol}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.usd += t.usd;
        existing.balance = String(Number(existing.balance) + Number(t.balance));
      } else {
        byKey.set(key, { ...t });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => b.usd - a.usd);
}

async function relayGet(path: string): Promise<unknown> {
  const res = await fetch(`${relayBase()}/api/exchange-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "server-signed", platform: "okx-dex", method: "GET", path }),
  });
  const json = await res.json();
  if (!res.ok) {
    const text = JSON.stringify(json ?? {});
    throw new Error(`OKX HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return json;
}

/** Fetch the real USD total and per-token detail for a DEX account (via relay). */
export async function okxFetchBalance(
  account: Account,
  opts?: FetchOptions
): Promise<BalanceResult> {
  const wallets = account.wallets ?? [];
  if (wallets.length === 0) throw new Error("No wallets on this account");

  const includeRisk = opts?.includeRiskTokens ?? false;
  const chains = chainsParam(account.chains);
  const totals = await Promise.all(
    wallets.map((w) => relayGet(requestPath("total", w.address, chains, includeRisk)))
  );
  const totalValue = totals.reduce<number>(
    (sum, j) => sum + parseTotalValue(j as never),
    0
  );

  const tokenLists = await Promise.all(
    wallets.map((w) => relayGet(requestPath("tokens", w.address, chains, includeRisk)))
  );
  const tokens = mergeTokenLists(tokenLists.map((j) => parseTokenAssets(j as never)));

  return { totalValue, tokens };
}
