import bittensor as bt
from psycopg_pool import ConnectionPool

from tao.collectors.base import BaseCollector
from tao.db.queries import metagraph as metagraph_db

class MetagraphCollector(BaseCollector):
    def __init__(self, subtensor: bt.Subtensor, pool: ConnectionPool, netuid: int) -> None:
        super().__init__(pool)
        self.subtensor = subtensor
        self.netuid = netuid

    @property
    def job_name(self) -> str:
        return f"metagraph_{self.netuid}"

    BLOCKS_PER_DAY = 7200

    def collect(self) -> list[dict]:
        meta = self.subtensor.metagraph(self.netuid)
        tempo = int(meta.tempo) if getattr(meta, "tempo", None) else 0
        rows = []
        for uid in meta.uids:
            uid = int(uid)
            emission = float(meta.emission[uid])
            daily_tao = (emission / tempo * self.BLOCKS_PER_DAY) if tempo > 0 else None
            rows.append({
                "netuid": self.netuid,
                "uid": uid,
                "hotkey": meta.hotkeys[uid],
                "coldkey": meta.coldkeys[uid],
                "stake_tao": float(meta.stake[uid]),
                "validator_trust": float(meta.validator_trust[uid]),
                "consensus": float(meta.consensus[uid]),
                "incentive": float(meta.incentive[uid]),
                "dividends": float(meta.dividends[uid]),
                "emission_tao": emission,
                "daily_tao": daily_tao,
                "active": bool(meta.active[uid]),
                "role": "validator" if float(meta.validator_trust[uid]) > 0 else "miner",
            })
        return rows

    def save(self, data: list[dict]) -> int:
        return metagraph_db.insert_snapshots(self.pool, data)
