from fastapi import APIRouter
from tao.db.connection import get_pool
from api.models import Balance

router = APIRouter()


@router.get("/balances", response_model=list[Balance])
def list_balances():
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT DISTINCT ON (coldkey)
                coldkey, balance_tao, collected_at
            FROM coldkey_balances
            ORDER BY coldkey, collected_at DESC
            """
        ).fetchall()
    return [
        Balance(coldkey=r[0], balance_tao=r[1], collected_at=r[2])
        for r in rows
    ]
