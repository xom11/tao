import logging
from datetime import datetime, timezone

import bittensor as bt
from apscheduler.executors.pool import ThreadPoolExecutor
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


def _get_netuids(subtensor: bt.Subtensor) -> list[int]:
    """Return all active subnet netuids."""
    subnets = subtensor.get_all_subnets_info()
    return [info.netuid for info in subnets]


def _run_subnet_overview(network: str, pool) -> None:
    subtensor = bt.Subtensor(network)
    SubnetOverviewCollector(subtensor, pool).run()


def _run_metagraphs(network: str, pool) -> None:
    subtensor = bt.Subtensor(network)
    netuids = _get_netuids(subtensor)
    log.info("Collecting metagraph for %d subnets...", len(netuids))
    for netuid in netuids:
        MetagraphCollector(subtensor, pool, netuid).run()


def _run_balances(network: str, pool, coldkeys) -> None:
    subtensor = bt.Subtensor(network)
    ColdkeyBalanceCollector(subtensor, pool, coldkeys).run()


def main() -> None:
    log.info("Starting Bittensor Monitor")
    log.info("Network: %s", settings.bt_network)

    log.info("Watched subnets: ALL")
    log.info("Coldkeys: %d configured", len(settings.coldkeys))

    pool = get_pool()
    network = settings.bt_network

    scheduler = BlockingScheduler(
        timezone="UTC",
        executors={"default": ThreadPoolExecutor(max_workers=3)},
    )
    now = datetime.now(timezone.utc)

    # Subnet overview — every 72 minutes
    scheduler.add_job(
        _run_subnet_overview,
        "interval",
        minutes=TEMPO_MINUTES,
        args=[network, pool],
        next_run_time=now,
        id="subnet_overview",
    )

    # Metagraph — one job that loops all subnets sequentially
    scheduler.add_job(
        _run_metagraphs,
        "interval",
        minutes=TEMPO_MINUTES,
        args=[network, pool],
        next_run_time=now,
        id="metagraph_all",
    )

    # Balance — every 24 hours
    if settings.coldkeys:
        scheduler.add_job(
            _run_balances,
            "interval",
            hours=24,
            args=[network, pool, settings.coldkeys],
            next_run_time=now,
            id="coldkey_balances",
        )
    else:
        log.info("No coldkeys configured — skipping balance collector")

    log.info("Scheduler started. Metagraph runs every %d minutes.", TEMPO_MINUTES)
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Shutting down...")
    finally:
        scheduler.shutdown(wait=True)
        close_pool()
