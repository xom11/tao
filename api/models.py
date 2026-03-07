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
    owner: str | None
    max_neurons: int | None
    emission_value: float | None
    tempo: int | None
    collected_at: datetime
    is_my_subnet: bool


class SubnetDetail(BaseModel):
    netuid: int
    owner: str | None
    max_neurons: int | None
    emission_value: float | None
    tempo: int | None
    difficulty: float | None
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
    active: bool | None
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
