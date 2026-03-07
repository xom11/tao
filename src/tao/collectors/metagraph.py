import bittensor as bt
from psycopg_pool import ConnectionPool

from tao.collectors.base import BaseCollector
from tao.db.queries import metagraph as metagraph_db

RAO_PER_TAO = 1_000_000_000


class MetagraphCollector(BaseCollector):
    def __init__(self, subtensor: bt.Subtensor, pool: ConnectionPool, netuid: int) -> None:
        super().__init__(pool)
        self.subtensor = subtensor
        self.netuid = netuid

    @property
    def job_name(self) -> str:
        return f"metagraph_{self.netuid}"

    def collect(self) -> list[dict]:
        meta = self.subtensor.metagraph(self.netuid)
        rows = []
        for uid in meta.uids:
            uid = int(uid)
            # stake is a Balance object — .tao gives TAO float
            stake_tao = float(meta.stake[uid])
            # emission is in rao — convert to TAO
            emission_tao = float(meta.emission[uid]) / RAO_PER_TAO
            rows.append({
                "netuid": self.netuid,
                "uid": uid,
                "hotkey": meta.hotkeys[uid],
                "coldkey": meta.coldkeys[uid],
                "stake_tao": stake_tao,
                "trust": float(meta.trust[uid]),
                "consensus": float(meta.consensus[uid]),
                "incentive": float(meta.incentive[uid]),
                "dividends": float(meta.dividends[uid]),
                "emission_tao": emission_tao,
                "active": bool(meta.active[uid]),
            })
        return rows

    def save(self, data: list[dict]) -> int:
        return metagraph_db.insert_snapshots(self.pool, data)
