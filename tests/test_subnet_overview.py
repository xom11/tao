"""
Test thủ công SubnetOverviewCollector.
Chạy: uv run python tests/test_subnet_overview.py
"""
import bittensor as bt

from tao.collectors.subnet_overview import SubnetOverviewCollector
from tao.db.connection import close_pool, get_pool


def main():
    sub = bt.Subtensor("finney")
    pool = get_pool()

    try:
        collector = SubnetOverviewCollector(sub, pool)
        rows = collector.collect()

        print(f"Total subnets: {len(rows)}")
        print(f"\nSample row:\n{rows[0]}")
    finally:
        close_pool()


if __name__ == "__main__":
    main()
