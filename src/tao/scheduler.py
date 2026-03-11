import logging
import time
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
_SUBTENSOR_MAX_RETRIES = 3
_SUBTENSOR_RETRY_DELAY = 20  # seconds between retries


def _create_subtensor(network: str) -> bt.Subtensor:
    """Create a Subtensor connection with retry logic for transient network errors."""
    last_exc: Exception | None = None
    for attempt in range(_SUBTENSOR_MAX_RETRIES):
        try:
            return bt.Subtensor(network)
        except Exception as e:
            last_exc = e
            if attempt < _SUBTENSOR_MAX_RETRIES - 1:
                log.warning(
                    "Subtensor connection failed (attempt %d/%d): %s. Retrying in %ds...",
                    attempt + 1, _SUBTENSOR_MAX_RETRIES, e, _SUBTENSOR_RETRY_DELAY,
                )
                time.sleep(_SUBTENSOR_RETRY_DELAY)
    raise last_exc


def _get_netuids(subtensor: bt.Subtensor) -> list[int]:
    """Return all active subnet netuids."""
    subnets = subtensor.get_all_subnets_info()
    return [info.netuid for info in subnets]


def _run_subnet_overview(network: str, pool) -> None:
    subtensor = _create_subtensor(network)
    SubnetOverviewCollector(subtensor, pool).run()


_RECONNECT_AFTER_CONSECUTIVE_ERRORS = 3


def _run_metagraphs(network: str, pool) -> None:
    subtensor = _create_subtensor(network)
    netuids = _get_netuids(subtensor)
    log.info("Collecting metagraph for %d subnets...", len(netuids))
    consecutive_errors = 0
    for netuid in netuids:
        ok = MetagraphCollector(subtensor, pool, netuid).run()
        if ok:
            consecutive_errors = 0
        else:
            consecutive_errors += 1
            if consecutive_errors >= _RECONNECT_AFTER_CONSECUTIVE_ERRORS:
                log.warning(
                    "%d consecutive errors — reconnecting subtensor...",
                    consecutive_errors,
                )
                try:
                    subtensor = _create_subtensor(network)
                    consecutive_errors = 0
                    log.info("Subtensor reconnected OK")
                except Exception as e:
                    log.error("Reconnect failed: %s — aborting remaining subnets", e)
                    break


def _run_balances(network: str, pool, coldkeys) -> None:
    subtensor = _create_subtensor(network)
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
