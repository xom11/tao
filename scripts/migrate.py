#!/usr/bin/env python
"""
Migrate DB schema: thêm các cột còn thiếu so với schema.sql hiện tại.
An toàn để chạy nhiều lần (idempotent).

Dùng khi pull code mới có thay đổi schema:
    uv run python scripts/migrate.py
"""
import re
import sys
from pathlib import Path

import psycopg
from psycopg import sql

from tao.config import settings

SCHEMA_PATH = Path(__file__).parent.parent / "src" / "tao" / "db" / "schema.sql"

# Map kiểu SQL trong schema.sql → kiểu ALTER TABLE
# (chỉ cần normalize để so sánh, không dùng để cast)
def _parse_schema_columns(sql: str) -> dict[str, dict[str, str]]:
    """
    Đọc schema.sql, trả về {table: {column: type_sql}}.
    Chỉ parse CREATE TABLE IF NOT EXISTS blocks.
    """
    tables: dict[str, dict[str, str]] = {}
    # Match từng CREATE TABLE block
    for m in re.finditer(
        r"CREATE TABLE IF NOT EXISTS (\w+)\s*\((.+?)\);",
        sql,
        re.DOTALL | re.IGNORECASE,
    ):
        table = m.group(1)
        body = m.group(2)
        cols: dict[str, str] = {}
        for line in body.splitlines():
            line = line.strip().rstrip(",")
            if not line or line.upper().startswith(("--", "PRIMARY", "UNIQUE", "FOREIGN", "CHECK", "CONSTRAINT")):
                continue
            # Tách tên cột + type (lấy trước comment --)
            line = re.sub(r"--.*$", "", line).strip()
            parts = line.split()
            if len(parts) < 2:
                continue
            col_name = parts[0]
            # Lấy phần type: tất cả sau tên cột, bỏ constraint keywords cuối
            type_str = " ".join(parts[1:])
            # Loại bỏ NOT NULL, DEFAULT ... ở cuối để lấy base type
            type_clean = re.split(r"\s+(NOT NULL|DEFAULT|REFERENCES|CHECK)\b", type_str, flags=re.IGNORECASE)[0].strip()
            cols[col_name] = type_clean
        tables[table] = cols
    return tables


def _get_db_columns(conn: psycopg.Connection, table: str) -> set[str]:
    """Lấy danh sách cột hiện có trong DB."""
    rows = conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s",
        (table,),
    ).fetchall()
    return {r[0] for r in rows}


def _table_exists(conn: psycopg.Connection, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_name = %s",
        (table,),
    ).fetchone()
    return row is not None


def migrate() -> None:
    schema_sql = SCHEMA_PATH.read_text()
    schema_tables = _parse_schema_columns(schema_sql)

    print(f"Connecting to: {settings.database_url}")
    with psycopg.connect(settings.database_url) as conn:
        any_change = False
        for table, cols in schema_tables.items():
            if not _table_exists(conn, table):
                print(f"  [SKIP] Table '{table}' chưa tồn tại — chạy init_db.py trước.")
                continue

            db_cols = _get_db_columns(conn, table)
            missing = {c: t for c, t in cols.items() if c not in db_cols}

            if not missing:
                print(f"  [OK]   {table} — không có cột nào thiếu.")
                continue

            for col, col_type in missing.items():
                stmt = sql.SQL(
                    "ALTER TABLE {} ADD COLUMN IF NOT EXISTS {} {}"
                ).format(
                    sql.Identifier(table),
                    sql.Identifier(col),
                    sql.SQL(col_type),
                )
                print(f"  [ADD]  {table}.{col}  ({col_type})")
                conn.execute(stmt)
                any_change = True

        conn.commit()

    if any_change:
        print("\nMigration hoàn tất.")
    else:
        print("\nDB đã up-to-date, không cần thay đổi gì.")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Lỗi: {e}", file=sys.stderr)
        sys.exit(1)
