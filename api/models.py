from datetime import datetime
from pydantic import BaseModel


class DashboardStats(BaseModel):
    runs_24h: int
    errors_24h: int
    my_subnets_count: int
    last_run_at: datetime | None


class CollectionRun(BaseModel):
    id: int
    job_name: str
    status: str
    rows_inserted: int
    error_message: str | None
    started_at: datetime
    finished_at: datetime


class SubnetOverview(BaseModel):
    netuid: int
    subnet_name: str | None
    symbol: str | None
    owner: str | None
    max_neurons: int | None
    emission_value: float | None
    tempo: int | None
    alpha_price_tao: float | None
    miner_daily_tao: float | None
    collected_at: datetime
    is_my_subnet: bool


class SubnetHistoryPoint(BaseModel):
    collected_at: datetime
    emission_pct: float | None   # emission_value * 100
    alpha_price_tao: float | None


def blocks_to_human(blocks: int | None) -> str | None:
    if blocks is None:
        return None
    seconds = blocks * 12
    d, rem = divmod(seconds, 86400)
    h, rem = divmod(rem, 3600)
    m = rem // 60
    parts = []
    if d:
        parts.append(f"{d}d")
    if h:
        parts.append(f"{h}h")
    if m:
        parts.append(f"{m}m")
    return " ".join(parts) or "0m"


class SubnetDetail(BaseModel):
    netuid: int
    subnet_name: str | None
    symbol: str | None
    owner: str | None
    max_neurons: int | None
    emission_value: float | None
    tempo: int | None
    difficulty: float | None
    immunity_period: int | None
    immunity_period_human: str | None
    alpha_price_tao: float | None
    description: str | None
    subnet_url: str | None
    github_repo: str | None
    discord: str | None
    logo_url: str | None
    subnet_contact: str | None
    collected_at: datetime
    is_my_subnet: bool


class Neuron(BaseModel):
    uid: int
    hotkey: str
    coldkey: str
    stake_tao: float | None
    validator_trust: float | None
    consensus: float | None
    incentive: float | None
    dividends: float | None
    emission_tao: float | None
    daily_tao: float | None
    active: bool | None
    role: str | None
    collected_at: datetime


class MySubnet(BaseModel):
    netuid: int
    coldkey: str | None
    hotkey: str | None
    notes: str | None
    updated_at: datetime | None
    stake_tao: float | None
    incentive: float | None
    emission_tao: float | None
    active: bool | None
    subnet_emission_value: float | None


class NotesUpdate(BaseModel):
    notes: str


class Balance(BaseModel):
    coldkey: str
    balance_tao: float | None
    collected_at: datetime | None
