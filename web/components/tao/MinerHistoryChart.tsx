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
import type { MinerHistoryPoint, Neuron } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

type Range = "7d" | "30d" | "all";
type ColorMode = "uid" | "coldkey";

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

function hslColor(index: number, total: number): string {
  const hue = Math.round((index / Math.max(total, 1)) * 300);
  return `hsl(${hue} 70% 55%)`;
}

type WideRow = Record<string, string | number>;

interface Props {
  data: MinerHistoryPoint[];
  neurons?: Neuron[];
}

export function MinerHistoryChart({ data, neurons }: Props) {
  const isMobile = useIsMobile();
  const [range, setRange] = useState<Range>("30d");
  const [colorMode, setColorMode] = useState<ColorMode>("uid");

  const filtered = useMemo(() => filterByRange(data, range), [data, range]);

  // UID → coldkey mapping from neurons
  const uidToColdkey = useMemo(() => {
    const map = new Map<number, string>();
    if (neurons) {
      for (const n of neurons) map.set(n.uid, n.coldkey);
    }
    return map;
  }, [neurons]);

  // Unique coldkeys (sorted) for consistent color assignment
  const coldkeyIndex = useMemo(() => {
    const keys = new Set<string>();
    uidToColdkey.forEach((ck) => keys.add(ck));
    const sorted = Array.from(keys).sort();
    const map = new Map<string, number>();
    sorted.forEach((ck, i) => map.set(ck, i));
    return map;
  }, [uidToColdkey]);

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

  // Pivot sang wide format
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

  function getColor(uid: number, uidIndex: number): string {
    if (colorMode === "coldkey") {
      const ck = uidToColdkey.get(uid);
      if (ck != null) {
        const idx = coldkeyIndex.get(ck) ?? 0;
        return hslColor(idx, coldkeyIndex.size);
      }
    }
    return hslColor(uidIndex, uids.length);
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No miner history data available.
      </p>
    );
  }

  const hasColdkeys = uidToColdkey.size > 0;
  const btnClass = (active: boolean) =>
    `px-3 py-1 text-xs rounded-md transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-2">Range:</span>
        {RANGES.map((r) => (
          <button key={r.value} onClick={() => setRange(r.value)} className={btnClass(range === r.value)}>
            {r.label}
          </button>
        ))}

        {hasColdkeys && (
          <>
            <span className="text-xs text-muted-foreground ml-4 mr-2">Color:</span>
            <button onClick={() => setColorMode("uid")} className={btnClass(colorMode === "uid")}>
              UID
            </button>
            <button onClick={() => setColorMode("coldkey")} className={btnClass(colorMode === "coldkey")}>
              Coldkey
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {uids.length} miners · {chartData.length} snapshots
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={isMobile ? 240 : 380}>
        <LineChart data={chartData} margin={{ top: 8, right: isMobile ? 8 : 16, left: isMobile ? 0 : 8, bottom: 8 }}>
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
            width={isMobile ? 40 : 60}
            label={isMobile ? undefined : { value: "Daily TAO (τ)", angle: -90, position: "left", offset: 16, fontSize: 11 }}
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
                  {sorted.slice(0, 12).map((e) => {
                    const uid = parseInt(String(e.dataKey).replace("uid_", ""), 10);
                    const ck = uidToColdkey.get(uid);
                    return (
                      <p key={String(e.dataKey)} className="flex items-center gap-1.5">
                        <span style={{ color: e.color }} className="text-[10px]">■</span>
                        <span>UID {uid}</span>
                        {colorMode === "coldkey" && ck && (
                          <span className="text-muted-foreground font-mono">{ck.slice(0, 4)}…{ck.slice(-3)}</span>
                        )}
                        <span className="font-semibold font-mono ml-auto pl-3">
                          {fTao(e.value as number)} τ
                        </span>
                      </p>
                    );
                  })}
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
              stroke={getColor(uid, i)}
              dot={false}
              strokeWidth={1.5}
              connectNulls={false}
              name={`UID ${uid}`}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
