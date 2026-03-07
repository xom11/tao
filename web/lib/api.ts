import type {
  DashboardStats,
  CollectionRun,
  SubnetOverview,
  SubnetDetail,
  Neuron,
  MySubnet,
  Balance,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string, revalidate = 30): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  dashboardStats: () => get<DashboardStats>("/api/dashboard/stats"),
  dashboardRuns: () => get<CollectionRun[]>("/api/dashboard/runs"),
  subnets: () => get<SubnetOverview[]>("/api/subnets"),
  subnet: (netuid: number) => get<SubnetDetail>(`/api/subnets/${netuid}`),
  neurons: (netuid: number) => get<Neuron[]>(`/api/subnets/${netuid}/neurons`),
  mySubnets: () => get<MySubnet[]>("/api/my-subnets"),
  balances: () => get<Balance[]>("/api/balances"),

  async patchNotes(netuid: number, notes: string): Promise<void> {
    await fetch(`${API}/api/my-subnets/${netuid}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  },
};
