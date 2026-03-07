#!/usr/bin/env python
"""Tạo schema PostgreSQL lần đầu. Chạy một lần trước khi start scheduler."""
from pathlib import Path

import psycopg

from tao.config import settings

SCHEMA_PATH = Path(__file__).parent.parent / "src" / "tao" / "db" / "schema.sql"


def _ensure_database(url: str) -> None:
    """Tạo database nếu chưa tồn tại."""
    from psycopg.conninfo import conninfo_to_dict
    params = conninfo_to_dict(url)
    dbname = params.pop("dbname", params.pop("database", "tao_db"))
    # Kết nối vào postgres (luôn tồn tại) để tạo DB
    with psycopg.connect(**params, dbname="postgres", autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (dbname,)
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{dbname}"')
            print(f"Database '{dbname}' created.")
        else:
            print(f"Database '{dbname}' already exists.")


def main() -> None:
    schema = SCHEMA_PATH.read_text()
    print(f"Connecting to: {settings.database_url}")
    _ensure_database(settings.database_url)
    with psycopg.connect(settings.database_url) as conn:
        conn.execute(schema)
        conn.commit()
    print("Schema created successfully.")
    print("Tables: coldkey_balances, subnet_overview_snapshots, metagraph_snapshots, collection_runs")


if __name__ == "__main__":
    main()
