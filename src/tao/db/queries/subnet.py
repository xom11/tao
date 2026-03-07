from datetime import datetime, timezone

from psycopg_pool import ConnectionPool


def insert_snapshots(pool: ConnectionPool, rows: list[dict]) -> int:
    if not rows:
        return 0
    collected_at = datetime.now(timezone.utc)
    with pool.connection() as conn:
        conn.executemany(
            """
            INSERT INTO subnet_overview_snapshots
                (netuid, owner, max_neurons, emission_value, tempo, difficulty, collected_at)
            VALUES
                (%(netuid)s, %(owner)s, %(max_neurons)s, %(emission_value)s,
                 %(tempo)s, %(difficulty)s, %(collected_at)s)
            """,
            [{**row, "collected_at": collected_at} for row in rows],
        )
    return len(rows)
