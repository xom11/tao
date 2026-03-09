import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function BalancesPage() {
  const balances = await api.balances();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Coldkey Balances</h1>
      <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coldkey</TableHead>
            <TableHead className="text-right">Balance (TAO)</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((b) => (
            <TableRow key={b.coldkey}>
              <TableCell className="font-mono text-xs">{b.coldkey}</TableCell>
              <TableCell className="text-right font-medium">
                {b.balance_tao?.toFixed(4) ?? "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {b.collected_at ? new Date(b.collected_at).toLocaleString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
