"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubnetOverview } from "@/lib/types";

const STARRED_KEY = "starred_subnets";

function loadStarred(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveStarred(starred: Set<number>) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(starred)));
}

function StarButton({ netuid, starred, onToggle }: { netuid: number; starred: boolean; onToggle: (netuid: number) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(netuid); }}
      className="ml-2 leading-none align-middle text-base transition-colors"
      aria-label={starred ? "Bỏ đánh dấu" : "Đánh dấu theo dõi"}
    >
      {starred
        ? <span className="text-yellow-400">★</span>
        : <span className="text-muted-foreground/30 hover:text-yellow-300">☆</span>
      }
    </button>
  );
}

type SortKey = "netuid" | "alpha_price_tao" | "max_neurons" | "emission_value" | "tempo" | "miner_daily_tao" | "miner_earning_count" | "register_fee_tao";
type Dir = "asc" | "desc";

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: Dir } }) {
  if (sort.key !== col) return <span className="ml-1 opacity-20">↕</span>;
  return <span className="ml-1">{sort.dir === "asc" ? "↑" : "↓"}</span>;
}

export function SubnetTable({ subnets }: { subnets: SubnetOverview[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "netuid", dir: "asc" });
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const router = useRouter();

  useEffect(() => { setStarred(loadStarred()); }, []);

  function toggleStar(netuid: number) {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(netuid) ? next.delete(netuid) : next.add(netuid);
      saveStarred(next);
      return next;
    });
  }

  function toggle(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  }

  const sorted = [...subnets].sort((a, b) => {
    const mul = sort.dir === "asc" ? 1 : -1;
    const av = (a[sort.key] as number | null) ?? -Infinity;
    const bv = (b[sort.key] as number | null) ?? -Infinity;
    return mul * (av < bv ? -1 : av > bv ? 1 : 0);
  });

  const th = (key: SortKey, label: string, className = "") => (
    <TableHead className={`cursor-pointer select-none hover:text-foreground ${className}`} onClick={() => toggle(key)}>
      {label}<SortIcon col={key} sort={sort} />
    </TableHead>
  );

  return (
    <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          {th("netuid", "NetUID")}
          <TableHead>Name</TableHead>
          {th("alpha_price_tao", "Alpha Price (τ)", "text-right")}
          {th("max_neurons", "Max Neurons", "text-right")}
          {th("emission_value", "Emission", "text-right")}
          {th("miner_earning_count", "Miners Earning", "text-right")}
          {th("miner_daily_tao", "Miner Daily τ", "text-right")}
          {th("register_fee_tao", "Reg Fee (τ)", "text-right")}
          {th("tempo", "Tempo", "text-right")}
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((s) => (
          <TableRow
            key={s.netuid}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/subnets/${s.netuid}`)}
          >
            <TableCell>
              <span className="font-medium">{s.netuid}</span>
              <StarButton netuid={s.netuid} starred={starred.has(s.netuid)} onToggle={toggleStar} />
            </TableCell>
            <TableCell>
              <span className="font-medium">{s.subnet_name ?? "—"}</span>
              {s.symbol && (
                <span className="ml-1 text-xs text-muted-foreground">{s.symbol}</span>
              )}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {s.alpha_price_tao != null ? s.alpha_price_tao.toFixed(6) : "—"}
            </TableCell>
            <TableCell className="text-right">{s.max_neurons ?? "—"}</TableCell>
            <TableCell className="text-right">
              {s.emission_value != null ? `${(s.emission_value * 100).toFixed(2)}%` : "—"}
            </TableCell>
            <TableCell className="text-right">
              {s.miner_earning_count != null && s.miner_earning_count > 0 ? (
                <span>{s.miner_earning_count}</span>
              ) : "—"}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {s.miner_daily_tao != null && s.miner_daily_tao > 0 ? (
                <span className="text-green-600 dark:text-green-400">
                  {s.miner_daily_tao >= 1000
                    ? `${(s.miner_daily_tao / 1000).toFixed(2)}k`
                    : s.miner_daily_tao.toFixed(2)} τ
                </span>
              ) : "—"}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {s.register_fee_tao != null ? `${s.register_fee_tao.toFixed(4)} τ` : "—"}
            </TableCell>
            <TableCell className="text-right">{s.tempo ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(s.collected_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
