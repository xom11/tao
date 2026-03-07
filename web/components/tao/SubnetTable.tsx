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
          <TableHead>Owner</TableHead>
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
            <TableCell className="font-mono text-xs max-w-xs truncate">{s.owner ?? "—"}</TableCell>
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
