from fastapi import APIRouter, HTTPException
from tao.db.connection import get_pool
from tao.db.queries import my_subnets as my_subnets_q
from api.models import SubnetOverview, SubnetDetail, SubnetHistoryPoint, MySubnet, MySubnetUpsert, NotesUpdate, blocks_to_human

router = APIRouter()


@router.get("/subnets", response_model=list[SubnetOverview])
def list_subnets():
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            WITH latest_mg AS (
                SELECT DISTINCT ON (netuid) netuid, collected_at
                FROM metagraph_snapshots
                ORDER BY netuid, collected_at DESC
            ),
            miner_totals AS (
                SELECT mg.netuid,
                    SUM(mg.daily_tao) AS miner_daily_tao,
                    COUNT(*) FILTER (WHERE mg.daily_tao > 0) AS miner_earning_count
                FROM metagraph_snapshots mg
                JOIN latest_mg ON mg.netuid = latest_mg.netuid
                    AND mg.collected_at = latest_mg.collected_at
                WHERE mg.role = 'miner' AND mg.daily_tao IS NOT NULL
                GROUP BY mg.netuid
            )
            SELECT DISTINCT ON (s.netuid)
                s.netuid, s.subnet_name, s.symbol, s.owner, s.max_neurons,
                s.emission_value, s.tempo, s.alpha_price_tao, s.collected_at,
                (ms.netuid IS NOT NULL) AS is_my_subnet,
                mt.miner_daily_tao,
                mt.miner_earning_count,
                s.register_fee_tao
            FROM subnet_overview_snapshots s
            LEFT JOIN my_subnets ms ON ms.netuid = s.netuid
            LEFT JOIN miner_totals mt ON mt.netuid = s.netuid
            ORDER BY s.netuid, s.collected_at DESC
            """
        ).fetchall()
    return [
        SubnetOverview(
            netuid=r[0],
            subnet_name=r[1],
            symbol=r[2],
            owner=r[3],
            max_neurons=r[4],
            emission_value=r[5],
            tempo=r[6],
            alpha_price_tao=r[7],
            collected_at=r[8],
            is_my_subnet=r[9],
            miner_daily_tao=r[10],
            miner_earning_count=r[11],
            register_fee_tao=r[12],
        )
        for r in rows
    ]


@router.get("/subnets/{netuid}", response_model=SubnetDetail)
def get_subnet(netuid: int):
    pool = get_pool()
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT DISTINCT ON (netuid)
                s.netuid, s.subnet_name, s.symbol, s.owner, s.max_neurons,
                s.emission_value, s.tempo, s.difficulty, s.immunity_period,
                s.alpha_price_tao, s.register_fee_tao,
                s.description, s.subnet_url, s.github_repo, s.discord, s.logo_url, s.subnet_contact,
                s.collected_at,
                (ms.netuid IS NOT NULL) AS is_my_subnet,
                ms.notes
            FROM subnet_overview_snapshots s
            LEFT JOIN my_subnets ms ON ms.netuid = s.netuid
            WHERE s.netuid = %s
            ORDER BY netuid, collected_at DESC
            """,
            (netuid,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Subnet not found")
    return SubnetDetail(
        netuid=row[0],
        subnet_name=row[1],
        symbol=row[2],
        owner=row[3],
        max_neurons=row[4],
        emission_value=row[5],
        tempo=row[6],
        difficulty=row[7],
        immunity_period=row[8],
        immunity_period_human=blocks_to_human(row[8]),
        alpha_price_tao=row[9],
        register_fee_tao=row[10],
        description=row[11],
        subnet_url=row[12],
        github_repo=row[13],
        discord=row[14],
        logo_url=row[15],
        subnet_contact=row[16],
        collected_at=row[17],
        is_my_subnet=row[18],
        notes=row[19],
    )


@router.get("/my-subnets", response_model=list[MySubnet])
def list_my_subnets():
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT ms.netuid, ms.coldkey, ms.hotkey, ms.notes, ms.updated_at,
                mg.stake_tao, mg.incentive, mg.emission_tao, mg.active,
                so.emission_value
            FROM my_subnets ms
            LEFT JOIN LATERAL (
                SELECT stake_tao, incentive, emission_tao, active
                FROM metagraph_snapshots
                WHERE netuid = ms.netuid AND hotkey = ms.hotkey
                ORDER BY collected_at DESC LIMIT 1
            ) mg ON true
            LEFT JOIN LATERAL (
                SELECT emission_value FROM subnet_overview_snapshots
                WHERE netuid = ms.netuid ORDER BY collected_at DESC LIMIT 1
            ) so ON true
            ORDER BY ms.netuid
            """
        ).fetchall()
    return [
        MySubnet(
            netuid=r[0],
            coldkey=r[1],
            hotkey=r[2],
            notes=r[3],
            updated_at=r[4],
            stake_tao=r[5],
            incentive=r[6],
            emission_tao=r[7],
            active=r[8],
            subnet_emission_value=r[9],
        )
        for r in rows
    ]


@router.get("/subnets/{netuid}/history", response_model=list[SubnetHistoryPoint])
def get_subnet_history(netuid: int, days: int = 90):
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT collected_at, emission_value, alpha_price_tao
            FROM subnet_overview_snapshots
            WHERE netuid = %s
              AND (%s = 0 OR collected_at >= NOW() - (%s || ' days')::INTERVAL)
            ORDER BY collected_at ASC
            """,
            (netuid, days, days),
        ).fetchall()
    return [
        SubnetHistoryPoint(
            collected_at=r[0],
            emission_pct=r[1] * 100 if r[1] is not None else None,
            alpha_price_tao=r[2],
        )
        for r in rows
    ]


@router.put("/my-subnets/{netuid}")
def upsert_my_subnet(netuid: int, body: MySubnetUpsert):
    pool = get_pool()
    my_subnets_q.upsert(pool, netuid, coldkey=body.coldkey, hotkey=body.hotkey, notes=body.notes)
    return {"ok": True}


@router.delete("/my-subnets/{netuid}")
def delete_my_subnet(netuid: int):
    pool = get_pool()
    found = my_subnets_q.delete(pool, netuid)
    if not found:
        raise HTTPException(status_code=404, detail="Subnet not found")
    return {"ok": True}


@router.patch("/my-subnets/{netuid}/notes")
def patch_notes(netuid: int, body: NotesUpdate):
    pool = get_pool()
    my_subnets_q.update_notes(pool, netuid, body.notes)
    return {"ok": True}
