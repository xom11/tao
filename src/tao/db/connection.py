from psycopg_pool import ConnectionPool

from tao.config import settings

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            settings.database_url,
            min_size=2,
            max_size=10,
            timeout=5.0,
            max_idle=300.0,
            kwargs={"options": "-c statement_timeout=10000"},
        )
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
