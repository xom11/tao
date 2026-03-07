import logging
from datetime import datetime, timedelta, timezone

import bittensor as bt
from apscheduler.schedulers.blocking import BlockingScheduler

from tao.collectors.coldkey_balance import ColdkeyBalanceCollector
from tao.collectors.metagraph import MetagraphCollector
from tao.collectors.subnet_overview import SubnetOverviewCollector
from tao.config import settings
from tao.db.connection import close_pool, get_pool

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger(__name__)

TEMPO_MINUTES = 72
METAGRAPH_STAGGER_MINUTES = 5


def main() -> None:
    log.info("Starting Bittensor Monitor")
    log.info("Network: %s", settings.bt_network)
    log.info("Watched subnets: %s", settings.watched_subnet_netuids)
    log.info("Coldkeys: %d configured", len(settings.coldkeys))

    pool = get_pool()
    subtensor = bt.Subtensor(settings.bt_network)

    subnet_collector = SubnetOverviewCollector(subtensor, pool)
    metagraph_collectors = [
        MetagraphCollector(subtensor, pool, netuid)
        for netuid in settings.watched_subnet_netuids
    ]
    balance_collector = ColdkeyBalanceCollector(subtensor, pool, settings.coldkeys)

    scheduler = BlockingScheduler(timezone="UTC")
    now = datetime.now(timezone.utc)

    # Subnet overview — every 72 minutes, run immediately on startup
    scheduler.add_job(
        subnet_collector.run,
        "interval",
        minutes=TEMPO_MINUTES,
        next_run_time=now,
        id="subnet_overview",
    )

    # Metagraph — every 72 minutes, staggered by 5 min per subnet
    for i, collector in enumerate(metagraph_collectors):
        start = now + timedelta(minutes=i * METAGRAPH_STAGGER_MINUTES)
        scheduler.add_job(
            collector.run,
            "interval",
            minutes=TEMPO_MINUTES,
            next_run_time=start,
            id=collector.job_name,
        )

    # Balance — every 24 hours, run immediately on startup
    scheduler.add_job(
        balance_collector.run,
        "interval",
        hours=24,
        next_run_time=now,
        id="coldkey_balances",
    )

    log.info("Scheduler configured. Starting...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Shutting down...")
    finally:
        close_pool()
