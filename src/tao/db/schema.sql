-- Bittensor Monitor — PostgreSQL Schema
-- Nguyên tắc: append-only, chỉ INSERT, không UPDATE/DELETE

CREATE TABLE IF NOT EXISTS coldkey_balances (
    id          BIGSERIAL PRIMARY KEY,
    coldkey     TEXT        NOT NULL,
    balance_tao NUMERIC(20, 9) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subnet_overview_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    netuid          INTEGER     NOT NULL,
    owner           TEXT,
    max_neurons     INTEGER,
    emission_value  NUMERIC,
    tempo           INTEGER,
    difficulty      NUMERIC,
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
