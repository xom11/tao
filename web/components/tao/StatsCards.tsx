import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const tiles = [
    { label: "Runs (24h)", value: stats.runs_24h },
    { label: "Errors (24h)", value: stats.errors_24h },
    { label: "Last Run", value: fmt(stats.last_run_at) },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
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
