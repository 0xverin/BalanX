// OKX Dex (OnchainOS Balance API) adapter — pure-browser signed requests.
// Verified live: CORS allows browser calls, signature scheme confirmed,
// total ≈ $20.6k for the test wallet (vs Binance ≈ $49.8k → ≈ $70.4k combined).

import type { Account, OkxDexCredential, TokenBalance } from "@/lib/types";
import type { BalanceResult, FetchOptions } from "@/lib/portfolio";

const BASE = "https://web3.okx.com";

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

/** OKX signature: Base64(HMAC-SHA256(timestamp + method + requestPath, secretKey)). */
export async function signRequest(
  cred: OkxDexCredential,
  method: string,
  path: string,
  timestamp: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cred.secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp + method + path)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
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

interface RawToken {
  symbol: string;
  balance: string;
  tokenPrice: string;
  chainIndex: string;
  isRiskToken: boolean;
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

async function getJson(
  cred: OkxDexCredential,
  path: string
): Promise<unknown> {
  const timestamp = new Date().toISOString();
  const sign = await signRequest(cred, "GET", path, timestamp);
  const res = await fetch(BASE + path, {
    headers: {
      "OK-ACCESS-KEY": cred.apiKey,
      "OK-ACCESS-SIGN": sign,
      "OK-ACCESS-PASSPHRASE": cred.passphrase,
      "OK-ACCESS-TIMESTAMP": timestamp,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OKX HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Fetch the real USD total and per-token detail for a DEX account. */
export async function okxFetchBalance(
  account: Account,
  opts?: FetchOptions
): Promise<BalanceResult> {
  const cred = account.credentials as OkxDexCredential | undefined;
  if (!cred) throw new Error("Missing OKX credentials");
  const wallets = account.wallets ?? [];
  if (wallets.length === 0) throw new Error("No wallets on this account");

  const includeRisk = opts?.includeRiskTokens ?? false;
  const chains = chainsParam(account.chains);
  const totals = await Promise.all(
    wallets.map((w) => getJson(cred, requestPath("total", w.address, chains, includeRisk)))
  );
  const totalValue = totals.reduce<number>(
    (sum, j) => sum + parseTotalValue(j as never),
    0
  );

  const tokenLists = await Promise.all(
    wallets.map((w) => getJson(cred, requestPath("tokens", w.address, chains, includeRisk)))
  );
  const tokens = mergeTokenLists(tokenLists.map((j) => parseTokenAssets(j as never)));

  return { totalValue, tokens };
}