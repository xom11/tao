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
                INSERT INTO metagraph_snapshots
                    (netuid, uid, hotkey, coldkey, stake_tao, validator_trust, consensus,
                     incentive, dividends, emission_tao, active, role, collected_at)
                VALUES
                    (%(netuid)s, %(uid)s, %(hotkey)s, %(coldkey)s, %(stake_tao)s,
                     %(validator_trust)s, %(consensus)s, %(incentive)s, %(dividends)s,
                     %(emission_tao)s, %(active)s, %(role)s, %(collected_at)s)
                """,
                [{**row, "collected_at": collected_at} for row in rows],
            )
    return len(rows)
