-- Bittensor Monitor — PostgreSQL Schema
-- Monitoring tables: append-only, chỉ INSERT, không UPDATE/DELETE
-- Config tables: editable (my_subnets)

CREATE TABLE IF NOT EXISTS coldkey_balances (
    id          BIGSERIAL PRIMARY KEY,
    coldkey     TEXT        NOT NULL,
    balance_tao NUMERIC(20, 9) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subnet_overview_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    netuid          INTEGER     NOT NULL,
    subnet_name     TEXT,
    symbol          TEXT,
    owner           TEXT,
    max_neurons     INTEGER,
    emission_value  NUMERIC,
    tempo           INTEGER,
    difficulty      NUMERIC,
    immunity_period INTEGER,            -- đơn vị: blocks (1 block ≈ 12s)
    alpha_price_tao DOUBLE PRECISION,  -- giá alpha token tính bằng TAO (dTAO)
    -- subnet identity (optional, set bởi owner)
    description     TEXT,
    subnet_url      TEXT,
    github_repo     TEXT,
    discord         TEXT,
    logo_url        TEXT,
    subnet_contact  TEXT,
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metagraph_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    netuid          INTEGER     NOT NULL,
    uid             INTEGER     NOT NULL,
    hotkey          TEXT,
    coldkey         TEXT,
    stake_tao       NUMERIC(20, 9),
    validator_trust DOUBLE PRECISION,
    consensus       DOUBLE PRECISION,
    incentive       DOUBLE PRECISION,
    dividends       DOUBLE PRECISION,
    emission_tao    NUMERIC(20, 9),
    active          BOOLEAN,
    collected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_runs (
    id              BIGSERIAL PRIMARY KEY,
    job_name        TEXT        NOT NULL,
    status          TEXT        NOT NULL,   -- 'success' | 'error'
    rows_inserted   INTEGER,
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL,
    finished_at     TIMESTAMPTZ NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coldkey_balances_coldkey
    ON coldkey_balances (coldkey, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_subnet_overview_netuid
    ON subnet_overview_snapshots (netuid, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_metagraph_netuid_uid
    ON metagraph_snapshots (netuid, uid, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_runs_job
    ON collection_runs (job_name, started_at DESC);

-- ============================================================
-- Tầng 2: Config table — subnets tôi tham gia (EDITABLE)
-- ============================================================

CREATE TABLE IF NOT EXISTS my_subnets (
    netuid      INTEGER PRIMARY KEY,
    coldkey     TEXT,           -- coldkey tôi dùng trong subnet này
    hotkey      TEXT,           -- hotkey tương ứng
    notes       TEXT,           -- markdown tự do: mô tả, link, tuỳ chỉnh
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at được set thủ công trong Python (tránh plpgsql dependency)
