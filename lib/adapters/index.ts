// Platform fetch dispatcher — routes an account refresh to the right adapter.
// Adding a new platform = implement an adapter + one line here.

import type { Account } from "@/lib/types";
import type { FetchBalance, FetchOptions } from "@/lib/portfolio";
import { okxFetchBalance } from "./okx-dex";
import { binanceFetchBalance } from "./binance";

export const fetchAccountBalance: FetchBalance = async (
  account: Account,
  opts?: FetchOptions
) => {
  switch (account.platform) {
    case "okx-dex":
      return okxFetchBalance(account, opts);
    case "binance":
      return binanceFetchBalance(account);
    default:
      throw new Error(`Unsupported platform: ${account.platform}`);
  }
};
