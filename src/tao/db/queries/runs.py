from datetime import datetime

from psycopg_pool import ConnectionPool


def insert_run(
    pool: ConnectionPool,
    job_name: str,
    status: str,
    rows_inserted: int,
    error_message: str | None,
    started_at: datetime,
    finished_at: datetime,
) -> None:
    with pool.connection() as conn:
        conn.execute(
            """
            INSERT INTO collection_runs
                (job_name, status, rows_inserted, error_message, started_at, finished_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (job_name, status, rows_inserted, error_message, started_at, finished_at),
        )
