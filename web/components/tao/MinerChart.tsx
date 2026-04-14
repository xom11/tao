"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Neuron } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

const BLOCKS_PER_DAY = 7200;

function getDailyTao(n: Neuron, tempo: number): number {
  if (n.daily_tao != null) return n.daily_tao;
  if (n.emission_tao == null || tempo === 0) return 0;
  return (n.emission_tao / tempo) * BLOCKS_PER_DAY;
}

function shortKey(key: string): string {
  return `${key.slice(0, 5)}…${key.slice(-4)}`;
}

function fTao(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(3)}k` : v.toFixed(4);
}

interface Point {
  x: number;   // daily TAO
  y: number;   // coldkey index (0 = top)
  uid: number;
  hotkey: string;
  coldkey: string;
}

interface Props {
  neurons: Neuron[];
  tempo: number;
}

export function MinerChart({ neurons, tempo }: Props) {
  const isMobile = useIsMobile();
  const miners = neurons
    .filter((n) => n.role === "miner")
    .map((n) => ({ ...n, daily: getDailyTao(n, tempo) }))
    .filter((n) => n.daily > 0);

  if (miners.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No miner emission data available.
      </p>
    );
  }

  // Group by coldkey, sort by max daily TAO desc
  const grouped = Map.groupBy(miners, (n) => n.coldkey);
  const coldkeys = Array.from(grouped.keys()).sort((a, b) => {
    const maxA = Math.max(...grouped.get(a)!.map((n) => n.daily));
    const maxB = Math.max(...grouped.get(b)!.map((n) => n.daily));
    return maxB - maxA;
  });

  // Y: index position (0 at top → reversed on chart)
  const points: Point[] = coldkeys.flatMap((ck, i) =>
    grouped.get(ck)!.map((n) => ({
      x: n.daily,
      y: coldkeys.length - 1 - i,   // flip so top coldkey = top of chart
      uid: n.uid,
      hotkey: n.hotkey,
      coldkey: n.coldkey,
    }))
  );

  const ROW_H = 32;
  const height = Math.max(300, coldkeys.length * ROW_H + 40);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {coldkeys.length} coldkeys · {miners.length} miners with emission &gt; 0 · sorted by max daily TAO
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: isMobile ? 8 : 24, left: isMobile ? 8 : 104, bottom: 24 }}>
          <XAxis
            type="number"
            dataKey="x"
            tickFormatter={fTao}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            name="Daily TAO"
            label={{ value: "Daily TAO (τ)", position: "insideBottom", offset: -2, fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, coldkeys.length - 0.5]}
            ticks={coldkeys.map((_, i) => coldkeys.length - 1 - i)}
            tickFormatter={(v: number) => shortKey(coldkeys[coldkeys.length - 1 - v] ?? "")}
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 0 : 80}
            hide={isMobile}
            name="Coldkey"
            label={isMobile ? undefined : { value: "Coldkey", angle: -90, position: "left", offset: 16, fontSize: 11 }}
          />
          {/* Horizontal guide lines per row */}
          {coldkeys.map((_, i) => (
            <ReferenceLine
              key={i}
              y={coldkeys.length - 1 - i}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              strokeDasharray="0"
            />
          ))}
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Point;
              return (
                <div className="rounded border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                  <p className="font-mono text-[11px] text-muted-foreground break-all">{d.coldkey}</p>
                  <p className="font-mono text-[11px] text-muted-foreground break-all">{d.hotkey}</p>
                  <p>UID <span className="font-semibold">{d.uid}</span></p>
                  <p>Daily TAO <span className="font-semibold font-mono text-green-600 dark:text-green-400">{fTao(d.x)} τ</span></p>
                </div>
              );
            }}
          />
          <Scatter
            data={points}
            fill="hsl(142 60% 45%)"
            opacity={0.85}
            r={5}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
