"use client";

import { useState } from "react";
import { useT, useI18n, formatUSD, formatUSDRaw, type Dict } from "@/lib/i18n-provider";
import { useNow } from "@/lib/use-now";
import { platformById } from "@/lib/platforms";
import { formatRelative, chainShortLabel } from "@/lib/format";
import type { Account, BalanceCategory } from "@/lib/types";
import { Badge, Button } from "./ui";
import { PlatformLogo } from "./platform-logo";
import { ChevronDownIcon, TrashIcon, AlertIcon } from "./icons";

const categoryKey: Record<BalanceCategory, keyof Dict> = {
  spot: "spot",
  funding: "funding",
  margin: "margin",
  earn: "earn",
  futures: "futures",
  unified: "unified",
  delivery: "delivery",
  perps: "perps",
  "spot-margin": "spotMargin",
};

export function AccountCard({
  account,
  filterRiskTokens,
  onDelete,
}: {
  account: Account;
  filterRiskTokens: boolean;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const platform = platformById[account.platform];
  const isDex = platform.kind === "dex";
  // hide dust: risk tokens (per setting) and anything worth under $1
  const tokens =
    account.tokens?.filter(
      (tk) => !(filterRiskTokens && tk.isRiskToken) && tk.usd >= 1
    ) ?? [];
  const maxTokenUsd = Math.max(...tokens.map((tk) => tk.usd), 1);
  const maxTypeUsd = Math.max(...(account.typeSubtotals ?? []).map((s) => s.usd), 1);

  const rel = formatRelative(account.lastRefreshed, now, lang, t);

  // known upstream errors → user-readable, localized copy
  const errorText = (() => {
    const e = account.error ?? "";
    if (e.includes("-2015")) return t.errPermission;
    if (e.includes("429") || /rate limit/i.test(e)) return t.errRateLimit;
    return e;
  })();

  return (
    <div className="glass float-in rounded-2xl p-5 transition-all duration-200 hover:border-line-strong">
      {/* card head */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{
              background: `${platform.brandColor}14`,
              borderColor: `${platform.brandColor}40`,
              color: platform.brandColor,
            }}
          >
            <PlatformLogo platform={platform} size={22} />
          </div>
          <div>
            <div className="font-semibold leading-tight">{account.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{t[platform.nameKey] as string}</Badge>
              {isDex && (
                <span className="text-xs text-soft">{t.wallets(account.wallets?.length ?? 0)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {confirming ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-2 py-1">
              <span className="text-xs text-destructive">{t.confirmDelete}</span>
              <button
                onClick={() => onDelete(account.id)}
                className="rounded-md bg-destructive px-2 py-0.5 text-xs font-semibold text-white hover:brightness-110 cursor-pointer"
              >
                {t.delete}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md px-2 py-0.5 text-xs text-muted hover:text-fg cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <Button
              variant="danger"
              className="h-8 px-2.5 text-xs"
              onClick={() => setConfirming(true)}
              aria-label={t.delete}
            >
              <TrashIcon size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* value */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-soft">{t.balance}</div>
          <div className="num mt-1 font-display text-2xl font-bold">{formatUSD(account.totalValue)}</div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-cardbg hover:text-fg cursor-pointer"
        >
          {open ? t.hideDetails : t.showDetails}
          <ChevronDownIcon size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-soft">
        <span>
          {t.lastRefreshed}: {rel}
        </span>
        {isDex && (
          <span>
            {account.chains?.map(chainShortLabel).join(" · ")}
          </span>
        )}
      </div>

      {errorText && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          <AlertIcon size={13} className="mt-0.5 shrink-0" />
          <span className="break-all">{errorText}</span>
        </div>
      )}

      {/* expanded detail */}
      {open && (
        <div className="mt-4 border-t border-line pt-4">
          {isDex ? (
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-2 pb-1 text-[10px] uppercase tracking-wider text-soft">
                <span>{t.token}</span>
                <span className="text-right">{t.amount}</span>
                <span className="text-right">{t.price}</span>
                <span className="text-right">{t.value}</span>
                <span className="w-8" />
              </div>
              {tokens.map((tk) => (
                <div
                  key={tk.symbol + tk.chain}
                  className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-cardbg ${
                    tk.isRiskToken ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{tk.symbol}</span>
                    <span className="hidden text-[10px] text-soft sm:inline">
                      {chainShortLabel(tk.chain)}
                    </span>
                  </div>
                  <span className="num text-right text-xs text-muted">{tk.balance}</span>
                  <span className="num text-right text-xs text-muted">${tk.price.toFixed(2)}</span>
                  <span className="num text-right text-sm font-semibold">${formatUSDRaw(tk.usd)}</span>
                  <div className="h-1.5 w-8 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(tk.usd / maxTokenUsd) * 100}%`,
                        background: "var(--grad-brand)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(account.typeSubtotals ?? []).map((s) => (
                <div key={s.type} className="rounded-lg px-2 py-1.5 hover:bg-cardbg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t[categoryKey[s.type]] as string}</span>
                    <span className="num font-semibold">${formatUSDRaw(s.usd)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.usd / maxTypeUsd) * 100}%`,
                        background: s.type === "futures" ? "var(--grad-green)" : "var(--grad-brand)",
                      }}
                    />
                  </div>
                </div>
              ))}
              {account.typeSubtotals?.some((s) => ["futures", "perps", "unified", "delivery"].includes(s.type) && s.usd !== 0) && (
                <p className="px-2 pt-1 text-[11px] text-soft">{t.inclUnrealized}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
