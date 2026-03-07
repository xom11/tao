from datetime import datetime, timezone

from psycopg_pool import ConnectionPool


def insert_snapshots(pool: ConnectionPool, rows: list[dict]) -> int:
    if not rows:
        return 0
    collected_at = datetime.now(timezone.utc)
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO subnet_overview_snapshots
                    (netuid, subnet_name, symbol, owner, max_neurons, emission_value,
                     tempo, difficulty, immunity_period, alpha_price_tao, collected_at)
                VALUES
                    (%(netuid)s, %(subnet_name)s, %(symbol)s, %(owner)s, %(max_neurons)s,
                     %(emission_value)s, %(tempo)s, %(difficulty)s, %(immunity_period)s,
                     %(alpha_price_tao)s, %(collected_at)s)
                """,
                [{**row, "collected_at": collected_at} for row in rows],
            )
    return len(rows)
