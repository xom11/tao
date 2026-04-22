import type {
  DashboardStats,
  CollectionRun,
  SubnetOverview,
  SubnetDetail,
  SubnetHistoryPoint,
  MinerHistoryPoint,
  Neuron,
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
  subnet: (netuid: number) => get<SubnetDetail>(`/api/subnets/${netuid}`, 0),
  neurons: (netuid: number) => get<Neuron[]>(`/api/subnets/${netuid}/neurons`, 0),
  subnetHistory: (netuid: number) => get<SubnetHistoryPoint[]>(`/api/subnets/${netuid}/history?days=90`, 0),
  minerHistory: (netuid: number) => get<MinerHistoryPoint[]>(`/api/subnets/${netuid}/miner-history?days=90`, 0),
  balances: () => get<Balance[]>("/api/balances"),
};
