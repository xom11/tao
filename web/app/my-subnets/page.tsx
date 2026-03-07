import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function f4(v: number | null) {
  return v == null ? "—" : v.toFixed(4);
}

export default async function MySubnetsPage() {
  const subnets = await api.mySubnets();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Subnets</h1>
      {subnets.length === 0 ? (
        <p className="text-muted-foreground">
          No subnets configured. Use{" "}
          <code className="text-sm bg-muted px-1 rounded">
            uv run python scripts/my_subnet.py add --netuid ...
          </code>
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NetUID</TableHead>
              <TableHead>Hotkey</TableHead>
              <TableHead className="text-right">Stake (TAO)</TableHead>
              <TableHead className="text-right">Incentive</TableHead>
              <TableHead className="text-right">Emission (TAO)</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subnets.map((s) => (
              <TableRow key={s.netuid}>
                <TableCell className="font-medium">{s.netuid}</TableCell>
                <TableCell className="font-mono text-xs max-w-xs truncate">
                  {s.hotkey ?? "—"}
                </TableCell>
                <TableCell className="text-right">{f4(s.stake_tao)}</TableCell>
                <TableCell className="text-right">{f4(s.incentive)}</TableCell>
                <TableCell className="text-right">{f4(s.emission_tao)}</TableCell>
                <TableCell>
                  {s.active == null ? "—" : (
                    <Badge variant={s.active ? "secondary" : "outline"}>
                      {s.active ? "yes" : "no"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                  {s.notes ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
