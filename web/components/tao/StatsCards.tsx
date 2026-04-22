import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats, SystemStatus } from "@/lib/types";

function fmtAgo(dt: string | null) {
  if (!dt) return "—";
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function StatsCards({
  stats,
  status,
}: {
  stats: DashboardStats;
  status: SystemStatus;
}) {
  const tiles = [
    { label: "Subnets", value: fmtNum(status.total_subnets) },
    { label: "Neurons", value: fmtNum(status.total_neurons) },
    { label: "Runs (24h)", value: String(stats.runs_24h) },
    { label: "Last Run", value: fmtAgo(stats.last_run_at) },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg md:text-2xl font-bold">{t.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
