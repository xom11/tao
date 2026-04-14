"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { SubnetHistoryPoint } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

type Range = "7d" | "30d" | "all";

function fmt(v: number, decimals = 4): string {
  return v.toFixed(decimals);
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:00`;
}

function filterByRange(data: SubnetHistoryPoint[], range: Range): SubnetHistoryPoint[] {
  if (range === "all") return data;
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 86400_000;
  return data.filter((p) => new Date(p.collected_at).getTime() >= cutoff);
}

interface SingleChartProps {
  data: SubnetHistoryPoint[];
  dataKey: "emission_pct" | "alpha_price_tao" | "register_fee_tao";
  label: string;
  unit: string;
  color: string;
  decimals?: number;
}

function SingleChart({ data, dataKey, label, unit, color, decimals = 4 }: SingleChartProps) {
  const isMobile = useIsMobile();
  const values = data.map((d) => d[dataKey]).filter((v): v is number => v != null);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const pad = (max - min) * 0.1 || 0.001;

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      {data.length < 2 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Not enough data points yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="collected_at"
              tickFormatter={shortDate}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={60}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tickFormatter={(v) => fmt(v, isMobile ? Math.min(decimals, 2) : decimals)}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 40 : 52}
            />
            <Tooltip
              content={({ active, payload, label: lbl }) => {
                if (!active || !payload?.length) return null;
                const val = payload[0].value as number | null;
                return (
                  <div className="rounded border bg-background px-3 py-1.5 text-xs shadow-md space-y-0.5">
                    <p className="text-muted-foreground">{shortDate(lbl as string)}</p>
                    <p className="font-semibold font-mono">
                      {val != null ? `${fmt(val, decimals)} ${unit}` : "—"}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
              dot={data.length <= 20}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

interface Props {
  history: SubnetHistoryPoint[];
}

const RANGES: { label: string; value: Range }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
];

export function SubnetHistoryChart({ history }: Props) {
  const [range, setRange] = useState<Range>("30d");

  const data = useMemo(() => filterByRange(history, range), [history, range]);

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No history data yet. Data is collected every ~72 minutes.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Range:</span>
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              range === r.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{data.length} snapshots</span>
      </div>

      {/* Charts */}
      <SingleChart
        data={data}
        dataKey="emission_pct"
        label="Emission (%)"
        unit="%"
        color="hsl(221 83% 53%)"
        decimals={3}
      />
      <SingleChart
        data={data}
        dataKey="alpha_price_tao"
        label="Alpha Price (τ)"
        unit="τ"
        color="hsl(142 71% 45%)"
        decimals={6}
      />
      <SingleChart
        data={data}
        dataKey="register_fee_tao"
        label="Register Fee (τ)"
        unit="τ"
        color="hsl(38 92% 50%)"
        decimals={4}
      />
    </div>
  );
}
