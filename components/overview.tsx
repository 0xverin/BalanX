"use client";

import { useMemo } from "react";
import { useT, formatUSD, useI18n } from "@/lib/i18n-provider";
import { useNow } from "@/lib/use-now";
import { formatRelative } from "@/lib/format";
import type { Snapshot } from "@/lib/types";
import { BalanceChart } from "./balance-chart";
import { RefreshIcon } from "./icons";
import { Button } from "./ui";

export function Overview({
  total,
  delta,
  snapshots,
  refreshing,
  lastRefreshed,
  onRefresh,
  onSnapshot,
}: {
  total: number;
  delta: number; // vs yesterday, USD
  snapshots: Snapshot[];
  refreshing: boolean;
  lastRefreshed: string;
  onRefresh: () => void;
  onSnapshot: () => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const now = useNow();
  const up = delta >= 0;

  const rel = useMemo(
    () => formatRelative(lastRefreshed, now, lang, t),
    [now, lastRefreshed, lang, t]
  );

  return (
    <section className="space-y-4">
      <div className="glass float-in rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted">
              {t.totalAssets}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-bold brand-text sm:text-5xl">
                {formatUSD(total)}
              </span>
              <span
                className={`num text-sm font-semibold ${
                  up ? "text-success" : "text-destructive"
                }`}
              >
                {up ? "▲" : "▼"} {formatUSD(Math.abs(delta))} {t.vsYesterday}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-soft">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              {t.lastRefreshed}: {rel}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onSnapshot} className="shrink-0">
              {t.recordSnapshot}
            </Button>
            <Button onClick={onRefresh} disabled={refreshing} className="shrink-0 px-5">
              <RefreshIcon className={refreshing ? "animate-spin" : ""} size={16} />
              {refreshing ? t.refreshing : t.refresh}
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted">{t.portfolioHistory}</h3>
            <span className="text-[11px] text-soft">30D</span>
          </div>
          <BalanceChart data={snapshots.slice(-30)} />
        </div>
      </div>
    </section>
  );
}
