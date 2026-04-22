from fastapi import APIRouter, Request, Response
from tao.db.connection import get_pool
from tao.config import settings
from api.models import DashboardStats, CollectionRun, SystemStatus
from api.cache import cached
from api.middleware import limiter

router = APIRouter()


@cached()
def _fetch_stats():
    pool = get_pool()
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT
                COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '24 hours') AS runs_24h,
                COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '24 hours' AND status = 'error') AS errors_24h,
                MAX(finished_at) AS last_run_at
            FROM collection_runs
            """
        ).fetchone()
    return DashboardStats(
        runs_24h=row[0],
        errors_24h=row[1],
        last_run_at=row[2],
    )


@router.get("/stats", response_model=DashboardStats)
@limiter.limit("30/minute")
def get_stats(request: Request, response: Response):
    response.headers["Cache-Control"] = "public, max-age=600, s-maxage=600"
    return _fetch_stats()


@cached()
def _fetch_runs():
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT id, job_name, status, rows_inserted, error_message, started_at, finished_at
            FROM collection_runs
            ORDER BY started_at DESC
            LIMIT 50
            """
        ).fetchall()
    return [
        CollectionRun(
            id=r[0],
            job_name=r[1],
            status=r[2],
            rows_inserted=r[3],
            error_message=r[4],
            started_at=r[5],
            finished_at=r[6],
        )
        for r in rows
    ]


@cached()
def _fetch_status():
    pool = get_pool()
    try:
        with pool.connection() as conn:
            row = conn.execute(
                """
                SELECT
                    (SELECT COUNT(DISTINCT netuid) FROM subnet_overview_snapshots
                     WHERE collected_at = (SELECT MAX(collected_at) FROM subnet_overview_snapshots)) AS total_subnets,
                    (SELECT COUNT(*) FROM metagraph_snapshots
                     WHERE collected_at = (SELECT MAX(collected_at) FROM metagraph_snapshots)) AS total_neurons,
                    (SELECT MAX(finished_at) FROM collection_runs WHERE status = 'success') AS last_success
                """
            ).fetchone()
        from datetime import datetime, timezone, timedelta
        last_success = row[2]
        scheduler_ok = (
            last_success is not None
            and (datetime.now(timezone.utc) - last_success) < timedelta(hours=3)
        )
        return SystemStatus(
            db_connected=True,
            network=settings.bt_network,
            total_subnets=row[0] or 0,
            total_neurons=row[1] or 0,
            scheduler_running=scheduler_ok,
        )
    except Exception:
        return SystemStatus(
            db_connected=False,
            network=settings.bt_network,
            total_subnets=0,
            total_neurons=0,
            scheduler_running=False,
        )


@router.get("/status", response_model=SystemStatus)
@limiter.limit("30/minute")
def get_status(request: Request, response: Response):
    response.headers["Cache-Control"] = "public, max-age=600, s-maxage=600"
    return _fetch_status()


@router.get("/runs", response_model=list[CollectionRun])
@limiter.limit("30/minute")
def get_runs(request: Request, response: Response):
    response.headers["Cache-Control"] = "public, max-age=600, s-maxage=600"
    return _fetch_runs()
