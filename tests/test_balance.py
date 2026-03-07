"""
Test thủ công ColdkeyBalanceCollector.
Chạy: uv run python tests/test_balance.py
"""
import bittensor as bt

from tao.collectors.coldkey_balance import ColdkeyBalanceCollector
from tao.config import settings
from tao.db.connection import close_pool, get_pool


def main():
    if not settings.coldkeys:
        print("Không có COLDKEYS trong .env")
        return

    sub = bt.Subtensor("finney")
    pool = get_pool()

    try:
        collector = ColdkeyBalanceCollector(sub, pool, settings.coldkeys)
        rows = collector.collect()

        for r in rows:
            print(f"{r['coldkey'][:10]}...  →  {r['balance_tao']:.4f} TAO")
    finally:
        close_pool()


if __name__ == "__main__":
    main()
