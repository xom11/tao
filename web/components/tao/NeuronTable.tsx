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

function f4(v: number | null) {
  return v == null ? "—" : v.toFixed(4);
}

export function NeuronTable({ neurons }: { neurons: Neuron[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">UID</TableHead>
          <TableHead>Hotkey</TableHead>
          <TableHead>Coldkey</TableHead>
          <TableHead className="text-right">Stake (TAO)</TableHead>
          <TableHead className="text-right">Incentive</TableHead>
          <TableHead className="text-right">Dividends</TableHead>
          <TableHead className="text-right">Emission</TableHead>
          <TableHead className="text-right">Trust</TableHead>
          <TableHead>Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {neurons.map((n) => (
          <TableRow key={n.uid}>
            <TableCell className="text-right">{n.uid}</TableCell>
            <TableCell className="font-mono text-xs max-w-xs truncate">{n.hotkey}</TableCell>
            <TableCell className="font-mono text-xs max-w-xs truncate">{n.coldkey}</TableCell>
            <TableCell className="text-right">{f4(n.stake_tao)}</TableCell>
            <TableCell className="text-right">{f4(n.incentive)}</TableCell>
            <TableCell className="text-right">{f4(n.dividends)}</TableCell>
            <TableCell className="text-right">{f4(n.emission_tao)}</TableCell>
            <TableCell className="text-right">{f4(n.validator_trust)}</TableCell>
            <TableCell>
              {n.active == null ? "—" : (
                <Badge variant={n.active ? "secondary" : "outline"}>
                  {n.active ? "yes" : "no"}
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
