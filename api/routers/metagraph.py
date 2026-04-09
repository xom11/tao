from fastapi import APIRouter
from tao.db.connection import get_pool
from api.models import Neuron

router = APIRouter()


@router.get("/subnets/{netuid}/neurons", response_model=list[Neuron])
def list_neurons(netuid: int):
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT uid, hotkey, coldkey, stake_tao, validator_trust, consensus,
                   incentive, dividends, emission_tao, daily_tao, active, role, collected_at
            FROM metagraph_snapshots
            WHERE netuid = %s
              AND collected_at = (
                  SELECT MAX(collected_at) FROM metagraph_snapshots WHERE netuid = %s
              )
            ORDER BY stake_tao DESC NULLS LAST
            """,
            (netuid, netuid),
        ).fetchall()
    return [
        Neuron(
            uid=r[0],
            hotkey=r[1],
            coldkey=r[2],
            stake_tao=r[3],
            validator_trust=r[4],
            consensus=r[5],
            incentive=r[6],
            dividends=r[7],
            emission_tao=r[8],
            daily_tao=r[9],
            active=r[10],
            role=r[11],
            collected_at=r[12],
        )
        for r in rows
    ]
