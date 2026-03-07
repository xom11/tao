"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Neuron } from "@/lib/types";

const BLOCKS_PER_DAY = 7200;

type SortKey = "uid" | "stake_tao" | "incentive" | "dividends" | "emission_tao" | "daily_tao" | "validator_trust";
type Dir = "asc" | "desc";
type RoleFilter = "all" | "validator" | "miner";

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

  function toggleRole(role: "validator" | "miner") {
    setRoleFilter((f) => f === role ? "all" : role);
  }

  const validators = neurons.filter((n) => n.role === "validator");
  const miners = neurons.filter((n) => n.role === "miner");
  const validatorDaily = validators.reduce((s, n) => s + dailyTao(n, tempo), 0);
  const minerDaily = miners.reduce((s, n) => s + dailyTao(n, tempo), 0);
  const validatorsEarning = validators.filter((n) => dailyTao(n, tempo) > 0).length;
  const minersEarning = miners.filter((n) => dailyTao(n, tempo) > 0).length;

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Validator card — click to filter */}
        <Card
          onClick={() => toggleRole("validator")}
          className={`cursor-pointer transition-all ${
            roleFilter === "validator"
              ? "ring-2 ring-primary"
              : "hover:border-foreground/30"
          }`}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>Validators — Daily TAO</span>
              {roleFilter === "validator" && (
                <span className="text-xs font-normal text-primary">• filtered</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold font-mono">{fTao(validatorDaily)} τ</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{validatorsEarning}/{validators.length}</span> earning
            </p>
          </CardContent>
        </Card>

        {/* Miner card — click to filter */}
        <Card
          onClick={() => toggleRole("miner")}
          className={`cursor-pointer transition-all ${
            roleFilter === "miner"
              ? "ring-2 ring-primary"
              : "hover:border-foreground/30"
          }`}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <span>Miners — Daily TAO</span>
              {roleFilter === "miner" && (
                <span className="text-xs font-normal text-primary">• filtered</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold font-mono">{fTao(minerDaily)} τ</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{minersEarning}/{miners.length}</span> earning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row count hint */}
      {roleFilter !== "all" && (
        <p className="text-xs text-muted-foreground">
          Showing {sorted.length} of {neurons.length} neurons
          {" "}—{" "}
          <button className="underline hover:text-foreground" onClick={() => setRoleFilter("all")}>
            clear filter
          </button>
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {th("uid", "UID", "text-right")}
            <TableHead>Role</TableHead>
            <TableHead>Hotkey</TableHead>
            <TableHead>Coldkey</TableHead>
            {th("stake_tao", "Stake (TAO)", "text-right")}
            {th("incentive", "Incentive", "text-right")}
            {th("dividends", "Dividends", "text-right")}
            {th("emission_tao", "Emission/tempo", "text-right")}
            {th("daily_tao", "Daily TAO", "text-right")}
            {th("validator_trust", "Trust", "text-right")}
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
                  {n.role === "validator" ? (
                    <Badge variant="default">V</Badge>
                  ) : n.role === "miner" ? (
                    <Badge variant="outline">M</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">{n.hotkey}</TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">{n.coldkey}</TableCell>
                <TableCell className="text-right">{f4(n.stake_tao)}</TableCell>
                <TableCell className="text-right">{f4(n.incentive)}</TableCell>
                <TableCell className="text-right">{f4(n.dividends)}</TableCell>
                <TableCell className="text-right">{f4(n.emission_tao)}</TableCell>
                <TableCell className="text-right font-mono">
                  {daily > 0 ? <span className="text-green-600 dark:text-green-400">{fTao(daily)} τ</span> : "—"}
                </TableCell>
                <TableCell className="text-right">{f4(n.validator_trust)}</TableCell>
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
  );
}
