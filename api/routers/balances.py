from fastapi import APIRouter, Request, Response
from tao.db.connection import get_pool
from api.models import Balance
from api.cache import cached
from api.middleware import limiter

router = APIRouter()


@cached(heavy=True)
def _fetch_balances():
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT DISTINCT ON (coldkey)
                coldkey, balance_tao, collected_at
            FROM coldkey_balances
            ORDER BY coldkey, collected_at DESC
            LIMIT 500
            """
        ).fetchall()
    return [
        Balance(coldkey=r[0], balance_tao=r[1], collected_at=r[2])
        for r in rows
    ]


@router.get("/balances", response_model=list[Balance])
@limiter.limit("10/minute")
def list_balances(request: Request, response: Response):
    response.headers["Cache-Control"] = "public, max-age=1800, s-maxage=1800"
    return _fetch_balances()
