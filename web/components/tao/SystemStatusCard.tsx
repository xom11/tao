import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemStatus, DashboardStats } from "@/lib/types";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
    />
  );
}

export function SystemStatusCard({
  status,
  stats,
}: {
  status: SystemStatus;
  stats: DashboardStats;
}) {
  const rows = [
    { label: "Database", value: status.db_connected ? "Connected" : "Disconnected", ok: status.db_connected },
    { label: "Scheduler", value: status.scheduler_running ? "Running" : "Stopped", ok: status.scheduler_running },
    { label: "Network", value: status.network, ok: true },
    { label: "Errors (24h)", value: String(stats.errors_24h), ok: stats.errors_24h === 0 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="flex items-center gap-2 font-medium">
              <Dot ok={r.ok} />
              {r.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
