"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Neuron } from "@/lib/types";

const BLOCKS_PER_DAY = 7200;

type SortKey = "uid" | "stake_tao" | "incentive" | "dividends" | "emission_tao" | "daily_tao" | "validator_trust";
type Dir = "asc" | "desc";
type RoleFilter = "all" | "validator" | "miner" | "owner";

function dailyTao(n: Neuron, tempo: number): number {
  if (n.daily_tao != null) return n.daily_tao;
  if (n.emission_tao == null || tempo === 0) return 0;
  return (n.emission_tao / tempo) * BLOCKS_PER_DAY;
}

function fTao(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(2)}k` : v.toFixed(2);
}

function f4(v: number | null) {
  return v == null ? "—" : v.toFixed(4);
}

function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);
  return (
    <span
      onClick={(e) => { e.stopPropagation(); copy(); }}
      className="cursor-pointer hover:text-foreground transition-colors"
      title="Click to copy"
    >
      {copied ? <span className="text-green-500">copied!</span> : text}
    </span>
  );
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: Dir } }) {
  if (sort.key !== col) return <span className="ml-1 opacity-20">↕</span>;
  return <span className="ml-1">{sort.dir === "asc" ? "↑" : "↓"}</span>;
}

export function NeuronTable({ neurons, tempo }: { neurons: Neuron[]; tempo: number }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "stake_tao", dir: "desc" });
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  function toggle(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  }

  const validators = neurons.filter((n) => n.role === "validator");
  const miners = neurons.filter((n) => n.role === "miner");
  const owners = neurons.filter((n) => n.role === "owner");

  const filtered = roleFilter === "all" ? neurons : neurons.filter((n) => n.role === roleFilter);

  const sorted = [...filtered].sort((a, b) => {
    const mul = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "daily_tao") return mul * (dailyTao(a, tempo) - dailyTao(b, tempo));
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
    <div className="space-y-3">
      {/* Filter buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Filter:</span>
        {([
          { role: "all", label: `All (${neurons.length})` },
          { role: "validator", label: `V ${validators.length}` },
          { role: "miner", label: `M ${miners.length}` },
          ...(owners.length > 0 ? [{ role: "owner", label: `O ${owners.length}` }] : []),
        ] as { role: RoleFilter; label: string }[]).map(({ role, label }) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role === roleFilter ? "all" : role)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              roleFilter === role
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        {roleFilter !== "all" && (
          <span className="text-xs text-muted-foreground ml-2">
            Showing {sorted.length} of {neurons.length}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {th("uid", "UID", "text-right")}
            <TableHead>Role</TableHead>
            <TableHead className="hidden md:table-cell">Hotkey</TableHead>
            <TableHead className="hidden md:table-cell">Coldkey</TableHead>
            {th("stake_tao", "Stake (TAO)", "text-right")}
            {th("incentive", "Incentive", "text-right")}
            {th("dividends", "Dividends", "text-right hidden md:table-cell")}
            {th("emission_tao", "Emission/tempo", "text-right hidden md:table-cell")}
            {th("daily_tao", "Daily TAO", "text-right")}
            {th("validator_trust", "Trust", "text-right hidden md:table-cell")}
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((n) => {
            const daily = dailyTao(n, tempo);
            return (
              <TableRow key={n.uid}>
                <TableCell className="text-right">{n.uid}</TableCell>
                <TableCell>
                  {n.role === "owner" ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">O</Badge>
                  ) : n.role === "validator" ? (
                    <Badge variant="default">V</Badge>
                  ) : n.role === "miner" ? (
                    <Badge variant="outline">M</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs max-w-[120px] truncate">
                  <CopyText text={n.hotkey} />
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs max-w-[120px] truncate">
                  <CopyText text={n.coldkey} />
                </TableCell>
                <TableCell className="text-right">{f4(n.stake_tao)}</TableCell>
                <TableCell className="text-right">{f4(n.incentive)}</TableCell>
                <TableCell className="hidden md:table-cell text-right">{f4(n.dividends)}</TableCell>
                <TableCell className="hidden md:table-cell text-right">{f4(n.emission_tao)}</TableCell>
                <TableCell className="text-right font-mono">
                  {daily > 0 ? <span className="text-green-600 dark:text-green-400">{fTao(daily)} τ</span> : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right">{f4(n.validator_trust)}</TableCell>
                <TableCell>
                  {n.active == null ? "—" : (
                    <Badge variant={n.active ? "secondary" : "outline"}>{n.active ? "yes" : "no"}</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
