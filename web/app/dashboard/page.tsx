import { api } from "@/lib/api";
import { StatsCards } from "@/components/tao/StatsCards";
import { CollectionRunsTable } from "@/components/tao/CollectionRunsTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, runs] = await Promise.all([api.dashboardStats(), api.dashboardRuns()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <StatsCards stats={stats} />
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Collection Runs</h2>
        <CollectionRunsTable runs={runs} />
      </div>
    </div>
  );
}
