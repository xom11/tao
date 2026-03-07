import bittensor as bt
from psycopg_pool import ConnectionPool

from tao.collectors.base import BaseCollector
from tao.db.queries import balance as balance_db


class ColdkeyBalanceCollector(BaseCollector):
    def __init__(
        self,
        subtensor: bt.Subtensor,
        pool: ConnectionPool,
        coldkeys: list[str],
    ) -> None:
        super().__init__(pool)
        self.subtensor = subtensor
        self.coldkeys = coldkeys

    @property
    def job_name(self) -> str:
        return "coldkey_balances"

    def collect(self) -> list[dict]:
        rows = []
        for coldkey in self.coldkeys:
            balance = self.subtensor.get_balance(coldkey)
            rows.append({
                "coldkey": coldkey,
                "balance_tao": float(balance),
            })
        return rows

    def save(self, data: list[dict]) -> int:
        return balance_db.insert_snapshots(self.pool, data)
