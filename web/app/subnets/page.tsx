import { api } from "@/lib/api";
import { SubnetTable } from "@/components/tao/SubnetTable";

export const dynamic = "force-dynamic";

export default async function SubnetsPage() {
  const subnets = await api.subnets();

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl font-bold">All Subnets ({subnets.length})</h1>
      <SubnetTable subnets={subnets} />
    </div>
  );
}
