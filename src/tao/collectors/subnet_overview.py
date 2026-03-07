import bittensor as bt
from psycopg_pool import ConnectionPool

from tao.collectors.base import BaseCollector
from tao.db.queries import subnet as subnet_db


class SubnetOverviewCollector(BaseCollector):
    def __init__(self, subtensor: bt.Subtensor, pool: ConnectionPool) -> None:
        super().__init__(pool)
        self.subtensor = subtensor

    @property
    def job_name(self) -> str:
        return "subnet_overview"

    def collect(self) -> list[dict]:
        subnets = self.subtensor.get_all_subnets_info()
        rows = []
        for info in subnets:
            rows.append({
                "netuid": int(info.netuid),
                "owner": info.owner_ss58,
                "max_neurons": int(info.max_n),
                "emission_value": int(info.emission_value),
                "tempo": int(info.tempo),
                "difficulty": int(info.difficulty),
            })
        return rows

    def save(self, data: list[dict]) -> int:
        return subnet_db.insert_snapshots(self.pool, data)
