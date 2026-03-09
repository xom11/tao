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

    ALPHA_PER_EPOCH = 360  # 1 alpha/block × 360 blocks/epoch
    EPOCHS_PER_DAY = 20   # 24h × 60min / 72min per epoch = 20
    MINER_EMISSION_SPLIT = 0.41
    VALIDATOR_EMISSION_SPLIT = 0.59  # dùng cho cả validator và owner

    # ------------------------------------------------------------------
    # Role detection — override _get_role() để plug in logic tùy chỉnh
    # ------------------------------------------------------------------

    def _fetch_owner_hotkey(self) -> str | None:
        """Lấy hotkey của owner subnet này. None nếu không tìm được."""
        try:
            for info in self.subtensor.get_all_subnets_info():
                if int(info.netuid) == self.netuid:
                    return info.owner_ss58
        except Exception:
            pass
        return None

    def _fetch_alpha_price(self) -> float | None:
        """Lấy giá alpha token (TAO/alpha) của subnet này."""
        try:
            for s in self.subtensor.all_subnets():
                if int(s.netuid) == self.netuid:
                    return float(s.price) if s.price is not None else None
        except Exception:
            pass
        return None

    def _get_role(self, meta, uid: int, owner_hotkey: str | None) -> str:
        """
        Xác định role của neuron. Thứ tự ưu tiên: owner > validator > miner.
        Override method này để thêm logic role tùy chỉnh.
        """
        if owner_hotkey and meta.hotkeys[uid] == owner_hotkey:
            return "owner"
        if float(meta.validator_trust[uid]) > 0:
            return "validator"
        return "miner"

    # ------------------------------------------------------------------
    # Daily TAO calculation theo role
    # ------------------------------------------------------------------

    def _get_daily_tao(
        self,
        meta,
        uid: int,
        role: str,
        total_validator_stake: float,
        alpha_price: float | None,
    ) -> float | None:
        """
        Miner:
            daily_alpha = 360 × 0.41 × incentive × 20
            daily_tao   = daily_alpha × alpha_price

        Validator / Owner: TODO — công thức đang xem xét lại
        """
        if role == "miner":
            if alpha_price is None:
                return None
            daily_alpha = (
                self.ALPHA_PER_EPOCH
                * self.MINER_EMISSION_SPLIT
                * float(meta.incentive[uid])
                * self.EPOCHS_PER_DAY
            )
            return daily_alpha * alpha_price

        if role in ("validator", "owner"):
            return 0.0

        return None

    # ------------------------------------------------------------------

    def collect(self) -> list[dict]:
        meta = self.subtensor.metagraph(self.netuid)
        owner_hotkey = self._fetch_owner_hotkey()

        # Tính role trước để dùng khi tính total_validator_stake
        roles = {int(uid): self._get_role(meta, int(uid), owner_hotkey) for uid in meta.uids}
        total_validator_stake = sum(
            float(meta.stake[uid])
            for uid, role in roles.items()
            if role in ("validator", "owner")
        )
        alpha_price = self._fetch_alpha_price()

        rows = []
        for uid in meta.uids:
            uid = int(uid)
            role = roles[uid]
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
                "emission_tao": float(meta.emission[uid]),
                "daily_tao": self._get_daily_tao(meta, uid, role, total_validator_stake, alpha_price),
                "active": bool(meta.active[uid]),
                "role": role,
            })
        return rows

    def save(self, data: list[dict]) -> int:
        return metagraph_db.insert_snapshots(self.pool, data)
