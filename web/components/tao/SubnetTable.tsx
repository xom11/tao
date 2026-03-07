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

export function SubnetTable({ subnets }: { subnets: SubnetOverview[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>NetUID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Alpha Price (τ)</TableHead>
          <TableHead className="text-right">Max Neurons</TableHead>
          <TableHead className="text-right">Emission</TableHead>
          <TableHead className="text-right">Tempo</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subnets.map((s) => (
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
            <TableCell className="text-right">{s.emission_value?.toFixed(4) ?? "—"}</TableCell>
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
