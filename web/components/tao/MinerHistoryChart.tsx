"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MinerHistoryPoint } from "@/lib/types";

type Range = "7d" | "30d" | "all";

const RANGES: { label: string; value: Range }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
];

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:00`;
}

function fTao(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(2)}k` : v.toFixed(4);
}

function filterByRange(data: MinerHistoryPoint[], range: Range): MinerHistoryPoint[] {
  if (range === "all") return data;
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 86400_000;
  return data.filter((p) => new Date(p.collected_at).getTime() >= cutoff);
}

function uidColor(index: number, total: number): string {
  const hue = Math.round((index / Math.max(total, 1)) * 300); // 0–300 để tránh màu trùng đầu/cuối
  return `hsl(${hue} 70% 55%)`;
}

type WideRow = Record<string, string | number>;

interface Props {
  data: MinerHistoryPoint[];
}

export function MinerHistoryChart({ data }: Props) {
  const [range, setRange] = useState<Range>("30d");

  const filtered = useMemo(() => filterByRange(data, range), [data, range]);

  // Unique UIDs sorted by avg daily_tao desc
  const uids = useMemo(() => {
    const totals = new Map<number, { sum: number; count: number; hotkey: string }>();
    for (const p of filtered) {
      const e = totals.get(p.uid) ?? { sum: 0, count: 0, hotkey: p.hotkey };
      e.sum += p.daily_tao;
      e.count += 1;
      e.hotkey = p.hotkey;
      totals.set(p.uid, e);
    }
    return Array.from(totals.entries())
      .map(([uid, { sum, count, hotkey }]) => ({ uid, avg: sum / count, hotkey }))
      .sort((a, b) => b.avg - a.avg);
  }, [filtered]);

  // Pivot sang wide format: [{date, uid_5: tao, uid_10: tao, ...}]
  const chartData = useMemo((): WideRow[] => {
    const byTime = new Map<string, WideRow>();
    for (const p of filtered) {
      if (!byTime.has(p.collected_at)) byTime.set(p.collected_at, { date: p.collected_at });
      byTime.get(p.collected_at)![`uid_${p.uid}`] = p.daily_tao;
    }
    return Array.from(byTime.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filtered]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No miner history data available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
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
        <span className="ml-auto text-xs text-muted-foreground">
          {uids.length} miners · {chartData.length} snapshots
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => shortDate(v as string)}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={60}
          />
          <YAxis
            tickFormatter={fTao}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={60}
            label={{ value: "Daily TAO (τ)", angle: -90, position: "left", offset: 16, fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const sorted = [...payload]
                .filter((e) => e.value != null)
                .sort((a, b) => (b.value as number) - (a.value as number));
              return (
                <div className="rounded border bg-background px-3 py-2 text-xs shadow-md space-y-1 max-h-64 overflow-y-auto min-w-[180px]">
                  <p className="text-muted-foreground font-medium">{shortDate(label as string)}</p>
                  {sorted.slice(0, 12).map((e) => (
                    <p key={String(e.dataKey)} className="flex items-center gap-1.5">
                      <span style={{ color: e.color }} className="text-[10px]">■</span>
                      <span>UID {String(e.dataKey).replace("uid_", "")}</span>
                      <span className="font-semibold font-mono ml-auto pl-3">
                        {fTao(e.value as number)} τ
                      </span>
                    </p>
                  ))}
                  {sorted.length > 12 && (
                    <p className="text-muted-foreground">+{sorted.length - 12} more</p>
                  )}
                </div>
              );
            }}
          />
          {uids.map(({ uid }, i) => (
            <Line
              key={uid}
              type="monotone"
              dataKey={`uid_${uid}`}
              stroke={uidColor(i, uids.length)}
              dot={false}
              strokeWidth={1.5}
              connectNulls={false}
              name={`UID ${uid}`}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* UID color legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {uids.map(({ uid }, i) => (
          <span key={uid} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span style={{ color: uidColor(i, uids.length) }}>■</span>
            <span className="font-mono">UID {uid}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
