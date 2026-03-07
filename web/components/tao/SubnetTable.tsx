"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SubnetOverview } from "@/lib/types";

type SortKey = "netuid" | "alpha_price_tao" | "max_neurons" | "emission_value" | "tempo";
type Dir = "asc" | "desc";

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: Dir } }) {
  if (sort.key !== col) return <span className="ml-1 opacity-20">↕</span>;
  return <span className="ml-1">{sort.dir === "asc" ? "↑" : "↓"}</span>;
}

export function SubnetTable({ subnets }: { subnets: SubnetOverview[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "netuid", dir: "asc" });

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
    <Table>
      <TableHeader>
        <TableRow>
          {th("netuid", "NetUID")}
          <TableHead>Name</TableHead>
          {th("alpha_price_tao", "Alpha Price (τ)", "text-right")}
          {th("max_neurons", "Max Neurons", "text-right")}
          {th("emission_value", "Emission", "text-right")}
          {th("tempo", "Tempo", "text-right")}
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((s) => (
          <TableRow key={s.netuid}>
            <TableCell>
              <Link href={`/subnets/${s.netuid}`} className="font-medium hover:underline">
                {s.netuid}
              </Link>
              {s.is_my_subnet && (
                <Badge variant="outline" className="ml-2 text-xs">⭐ mine</Badge>
              )}
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
            <TableCell className="text-right">{s.tempo ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(s.collected_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
