from datetime import datetime, timezone

from psycopg_pool import ConnectionPool


def insert_snapshots(pool: ConnectionPool, rows: list[dict]) -> int:
    if not rows:
        return 0
    collected_at = datetime.now(timezone.utc)
    with pool.connection() as conn:
        conn.executemany(
            """
            INSERT INTO coldkey_balances (coldkey, balance_tao, collected_at)
            VALUES (%(coldkey)s, %(balance_tao)s, %(collected_at)s)
            """,
            [{**row, "collected_at": collected_at} for row in rows],
        )
    return len(rows)
