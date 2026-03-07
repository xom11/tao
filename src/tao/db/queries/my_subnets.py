from datetime import datetime, timezone

from psycopg_pool import ConnectionPool


def _now():
    return datetime.now(timezone.utc)


def upsert(
    pool: ConnectionPool,
    netuid: int,
    coldkey: str | None = None,
    hotkey: str | None = None,
    notes: str | None = None,
) -> None:
    """Thêm hoặc cập nhật một subnet tham gia."""
    with pool.connection() as conn:
        conn.execute(
            """
            INSERT INTO my_subnets (netuid, coldkey, hotkey, notes)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (netuid) DO UPDATE SET
                coldkey    = COALESCE(EXCLUDED.coldkey,    my_subnets.coldkey),
                hotkey     = COALESCE(EXCLUDED.hotkey,     my_subnets.hotkey),
                notes      = COALESCE(EXCLUDED.notes,      my_subnets.notes),
                updated_at = %s
            """,
            (netuid, coldkey, hotkey, notes, _now()),
        )


def update_notes(pool: ConnectionPool, netuid: int, notes: str) -> None:
    """Cập nhật chỉ phần notes của một subnet."""
    with pool.connection() as conn:
        conn.execute(
            "UPDATE my_subnets SET notes = %s, updated_at = %s WHERE netuid = %s",
            (notes, _now(), netuid),
        )


def list_all(pool: ConnectionPool) -> list[dict]:
    with pool.connection() as conn:
        rows = conn.execute(
            "SELECT netuid, coldkey, hotkey, notes, updated_at FROM my_subnets ORDER BY netuid"
        ).fetchall()
    return [
        {
            "netuid": r[0],
            "coldkey": r[1],
            "hotkey": r[2],
            "notes": r[3],
            "updated_at": r[4],
        }
        for r in rows
    ]


def get(pool: ConnectionPool, netuid: int) -> dict | None:
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT netuid, coldkey, hotkey, notes, updated_at FROM my_subnets WHERE netuid = %s",
            (netuid,),
        ).fetchone()
    if not row:
        return None
    return {"netuid": row[0], "coldkey": row[1], "hotkey": row[2], "notes": row[3], "updated_at": row[4]}


def get_netuids(pool: ConnectionPool) -> list[int]:
    """Trả về danh sách netuid đang được theo dõi ở tầng 2."""
    with pool.connection() as conn:
        rows = conn.execute("SELECT netuid FROM my_subnets ORDER BY netuid").fetchall()
    return [r[0] for r in rows]
