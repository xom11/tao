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
        # all_subnets(): có subnet_name, symbol, price (dTAO)
        # get_all_subnets_info(): có max_n, difficulty, immunity_period
        all_info = {
            int(s.netuid): s
            for s in self.subtensor.get_all_subnets_info()
        }

        rows = []
        for s in self.subtensor.all_subnets():
            netuid = int(s.netuid)
            info = all_info.get(netuid)
            rows.append({
                "netuid": netuid,
                "subnet_name": s.subnet_name or None,
                "symbol": s.symbol or None,
                "owner": info.owner_ss58 if info else None,
                "max_neurons": int(info.max_n) if info else None,
                "emission_value": int(info.emission_value) if info else None,
                "tempo": int(s.tempo),
                "difficulty": int(info.difficulty) if info else None,
                "immunity_period": int(info.immunity_period) if info else None,
                "alpha_price_tao": float(s.price) if s.price is not None else None,
            })
        return rows

    def save(self, data: list[dict]) -> int:
        return subnet_db.insert_snapshots(self.pool, data)
