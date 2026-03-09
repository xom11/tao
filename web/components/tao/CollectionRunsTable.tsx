import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CollectionRun } from "@/lib/types";

function fmtDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function CollectionRunsTable({ runs }: { runs: CollectionRun[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Rows</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Error</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">{r.job_name}</TableCell>
            <TableCell>
              <Badge variant={r.status === "error" ? "destructive" : "secondary"}>
                {r.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{r.rows_inserted}</TableCell>
            <TableCell className="text-right">{fmtDuration(r.started_at, r.finished_at)}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(r.started_at).toLocaleString()}
            </TableCell>
            <TableCell className="text-xs text-red-500 max-w-xs truncate">
              {r.error_message ?? ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
