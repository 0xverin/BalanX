"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT, formatUSDRaw } from "@/lib/i18n-provider";
import type { Snapshot } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  const t = useT();
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-xl">
      <div className="text-xs text-muted">{label}</div>
      <div className="num mt-1 text-sm font-semibold text-fg">
        ${formatUSDRaw(payload[0].value)}
      </div>
      <div className="mt-0.5 text-[11px] text-soft">{t.totalValue}</div>
    </div>
  );
}

export function BalanceChart({ data }: { data: Snapshot[] }) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={["dataMin - 10000", "dataMax + 10000"]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            strokeWidth={2.5}
            fill="url(#blueFill)"
            activeDot={{ r: 5, fill: "#3B82F6", stroke: "var(--bg)", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#06B6D4"
            strokeWidth={1.5}
            strokeOpacity={0.35}
            fill="url(#cyanFill)"
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
