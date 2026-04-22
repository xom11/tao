export interface SystemStatus {
  db_connected: boolean;
  network: string;
  total_subnets: number;
  total_neurons: number;
  scheduler_running: boolean;
}

export interface DashboardStats {
  runs_24h: number;
  errors_24h: number;
  last_run_at: string | null;
}

export interface CollectionRun {
  id: number;
  job_name: string;
  status: string;
  rows_inserted: number;
  error_message: string | null;
  started_at: string;
  finished_at: string;
}

export interface SubnetOverview {
  netuid: number;
  subnet_name: string | null;
  symbol: string | null;
  owner: string | null;
  max_neurons: number | null;
  emission_value: number | null;
  tempo: number | null;
  alpha_price_tao: number | null;
  miner_daily_tao: number | null;
  miner_earning_count: number | null;
  register_fee_tao: number | null;
  collected_at: string;
}

export interface SubnetHistoryPoint {
  collected_at: string;
  emission_pct: number | null;
  alpha_price_tao: number | null;
  register_fee_tao: number | null;
}

export interface MinerHistoryPoint {
  collected_at: string;
  uid: number;
  hotkey: string;
  daily_tao: number;
}

export interface SubnetDetail extends SubnetOverview {
  difficulty: number | null;
  immunity_period: number | null;
  immunity_period_human: string | null;
  description: string | null;
  subnet_url: string | null;
  github_repo: string | null;
  discord: string | null;
  logo_url: string | null;
  subnet_contact: string | null;
}

export interface Neuron {
  uid: number;
  hotkey: string;
  coldkey: string;
  stake_tao: number | null;
  validator_trust: number | null;
  consensus: number | null;
  incentive: number | null;
  dividends: number | null;
  emission_tao: number | null;
  daily_tao: number | null;
  active: boolean | null;
  role: string | null;
  collected_at: string;
}

export interface Balance {
  coldkey: string;
  balance_tao: number | null;
  collected_at: string | null;
}
