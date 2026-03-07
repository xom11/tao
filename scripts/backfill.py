#!/usr/bin/env python
"""Chạy collectors thủ công để backfill dữ liệu."""
import argparse

import bittensor as bt

from tao.collectors.coldkey_balance import ColdkeyBalanceCollector
from tao.collectors.metagraph import MetagraphCollector
from tao.collectors.subnet_overview import SubnetOverviewCollector
from tao.config import settings
from tao.db.connection import close_pool, get_pool


def get_netuids(subtensor: bt.Subtensor, netuid_arg: int | None) -> list[int]:
    """Resolve which netuids to collect."""
    if netuid_arg:
        return [netuid_arg]
    if settings.watched_subnet_netuids:
        return settings.watched_subnet_netuids
    # No config → collect all active subnets
    subnets = subtensor.get_all_subnets_info()
    return [info.netuid for info in subnets]


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
        help="Netuid cụ thể cho metagraph. Mặc định: tất cả subnets",
    )
    args = parser.parse_args()

    pool = get_pool()
    subtensor = bt.Subtensor(settings.bt_network)

    try:
        if args.collector in ("subnet_overview", "all"):
            print("Running SubnetOverviewCollector...")
            SubnetOverviewCollector(subtensor, pool).run()

        if args.collector in ("metagraph", "all"):
            netuids = get_netuids(subtensor, args.netuid)
            print(f"Running MetagraphCollector for {len(netuids)} subnets...")
            for netuid in netuids:
                MetagraphCollector(subtensor, pool, netuid).run()

        if args.collector in ("balance", "all"):
            if settings.coldkeys:
                print("Running ColdkeyBalanceCollector...")
                ColdkeyBalanceCollector(subtensor, pool, settings.coldkeys).run()
            else:
                print("No coldkeys configured — skipping balance")

    finally:
        close_pool()


if __name__ == "__main__":
    main()
