"""
Test thủ công MetagraphCollector cho 1 subnet.
Chạy: uv run python tests/test_metagraph.py
       uv run python tests/test_metagraph.py 18
"""
import sys

import bittensor as bt

from tao.collectors.metagraph import MetagraphCollector
from tao.db.connection import close_pool, get_pool


def main():
    netuid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    sub = bt.Subtensor("finney")
    pool = get_pool()

    try:
        collector = MetagraphCollector(sub, pool, netuid)
        rows = collector.collect()

        print(f"Netuid {netuid}: {len(rows)} neurons")
        print(f"\nTop neuron by stake:\n{max(rows, key=lambda r: r['stake_tao'])}")
    finally:
        close_pool()


if __name__ == "__main__":
    main()
