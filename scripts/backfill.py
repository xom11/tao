#!/usr/bin/env python
"""Chạy collectors thủ công để backfill dữ liệu."""
import argparse

import bittensor as bt

from tao.collectors.coldkey_balance import ColdkeyBalanceCollector
from tao.collectors.metagraph import MetagraphCollector
from tao.collectors.subnet_overview import SubnetOverviewCollector
from tao.config import settings
from tao.db.connection import close_pool, get_pool


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill Bittensor data manually")
    parser.add_argument(
        "--collector",
        choices=["subnet_overview", "metagraph", "balance", "all"],
        default="all",
        help="Collector cần chạy (default: all)",
    )
    parser.add_argument(
        "--netuid",
        type=int,
        help="Netuid cụ thể cho metagraph (default: tất cả watched subnets)",
    )
    args = parser.parse_args()

    pool = get_pool()
    subtensor = bt.Subtensor(settings.bt_network)

    try:
        if args.collector in ("subnet_overview", "all"):
            print("Running SubnetOverviewCollector...")
            SubnetOverviewCollector(subtensor, pool).run()

        if args.collector in ("metagraph", "all"):
            netuids = [args.netuid] if args.netuid else settings.watched_subnet_netuids
            for netuid in netuids:
                print(f"Running MetagraphCollector for subnet {netuid}...")
                MetagraphCollector(subtensor, pool, netuid).run()

        if args.collector in ("balance", "all"):
            print("Running ColdkeyBalanceCollector...")
            ColdkeyBalanceCollector(subtensor, pool, settings.coldkeys).run()

    finally:
        close_pool()


if __name__ == "__main__":
    main()
