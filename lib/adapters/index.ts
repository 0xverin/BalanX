// Platform fetch dispatcher — routes an account refresh to the right adapter.
// Adding a new platform = implement an adapter + one line here.

import type { Account } from "@/lib/types";
import type { FetchBalance, FetchOptions } from "@/lib/portfolio";
import { okxFetchBalance } from "./okx-dex";
import { hyperliquidFetchBalance } from "./hyperliquid";
import { okxCexFetchBalance } from "./okx-cex";
import { binanceFetchBalance } from "./binance";
import { bybitFetchBalance } from "./bybit";
import { gateFetchBalance } from "./gate";
import { bitgetFetchBalance } from "./bitget";
import { kucoinFetchBalance } from "./kucoin";
import { asterFetchBalance } from "./aster";

export const fetchAccountBalance: FetchBalance = async (
  account: Account,
  opts?: FetchOptions
) => {
  switch (account.platform) {
    case "okx-dex":
      return okxFetchBalance(account, opts);
    case "hyperliquid":
      return hyperliquidFetchBalance(account);
    case "okx-cex":
      return okxCexFetchBalance(account);
    case "binance":
      return binanceFetchBalance(account);
    case "bybit":
      return bybitFetchBalance(account);
    case "gate":
      return gateFetchBalance(account);
    case "bitget":
      return bitgetFetchBalance(account);
    case "kucoin":
      return kucoinFetchBalance(account);
    case "aster":
      return asterFetchBalance(account);
    default:
      throw new Error(`Unsupported platform: ${account.platform}`);
  }
};
