#!/usr/bin/env python
"""Tạo schema PostgreSQL lần đầu. Chạy một lần trước khi start scheduler."""
from pathlib import Path

import psycopg

from tao.config import settings

SCHEMA_PATH = Path(__file__).parent.parent / "src" / "tao" / "db" / "schema.sql"


def main() -> None:
    schema = SCHEMA_PATH.read_text()
    print(f"Connecting to: {settings.database_url}")
    with psycopg.connect(settings.database_url) as conn:
        conn.execute(schema)
        conn.commit()
    print("Schema created successfully.")
    print("Tables: coldkey_balances, subnet_overview_snapshots, metagraph_snapshots, collection_runs")


if __name__ == "__main__":
    main()
