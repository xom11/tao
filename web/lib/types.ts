export interface DashboardStats {
  runs_24h: number;
  errors_24h: number;
  my_subnets_count: number;
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
  collected_at: string;
  is_my_subnet: boolean;
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
  active: boolean | null;
  collected_at: string;
}

export interface MySubnet {
  netuid: number;
  coldkey: string | null;
  hotkey: string | null;
  notes: string | null;
  updated_at: string | null;
  stake_tao: number | null;
  incentive: number | null;
  emission_tao: number | null;
  active: boolean | null;
  subnet_emission_value: number | null;
}

export interface Balance {
  coldkey: string;
  balance_tao: number | null;
  collected_at: string | null;
}
