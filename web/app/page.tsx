import { api } from "@/lib/api";
import { HeroSection } from "@/components/tao/HeroSection";
import { StatsCards } from "@/components/tao/StatsCards";
import { SystemStatusCard } from "@/components/tao/SystemStatusCard";
import { CollectionRunsTable } from "@/components/tao/CollectionRunsTable";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [status, stats, runs] = await Promise.all([
    api.systemStatus(),
    api.dashboardStats(),
    api.dashboardRuns(),
  ]);

  return (
    <div className="space-y-6">
      <HeroSection />
      <StatsCards stats={stats} status={status} />
      <SystemStatusCard status={status} stats={stats} />
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Collection Runs</h2>
        <CollectionRunsTable runs={runs} />
      </div>
    </div>
  );
}
