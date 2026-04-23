export const docs = {
  overview: `
## Overview

Tao Monitor is a real-time monitoring tool for the [Bittensor](https://bittensor.com) network. It continuously collects on-chain data from all subnets and presents it through a web dashboard.

### Architecture

\`\`\`
Bittensor Network (finney)
        ↓
  bittensor SDK
        ↓
┌─ Data Pipeline ─────────────────────┐
│  SubnetOverviewCollector            │
│  MetagraphCollector (all subnets)   │
│  ColdkeyBalanceCollector            │
│        ↓  every ~72 min (1 tempo)   │
│  PostgreSQL (append-only snapshots) │
└─────────────────────────────────────┘
        ↓
┌─ FastAPI REST API ──────────────────┐
│  /api/subnets, /api/dashboard, ...  │
│  Rate limited, cached (10-30 min)   │
└─────────────────────────────────────┘
        ↓
┌─ Next.js Frontend ──────────────────┐
│  Dashboard, Subnet Explorer, Charts │
└─────────────────────────────────────┘
\`\`\`

### Data Collection Cycle

Every **~72 minutes** (1 Bittensor tempo), three collectors run sequentially:

1. **Subnet Overview** — Collects name, symbol, emission, alpha price, identity for all ~129 subnets
2. **Metagraph** — Collects all neurons (UID, hotkey, coldkey, stake, trust, emission, role) for every subnet
3. **Coldkey Balance** — Tracks TAO balance for configured coldkeys

All data is **append-only** — each run creates a new snapshot, preserving full history.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Data collection | Python 3.12+, bittensor SDK |
| Scheduling | APScheduler 3.x (72-min interval) |
| Database | PostgreSQL + psycopg3 |
| API | FastAPI + uvicorn |
| Frontend | Next.js 14 + Tailwind + shadcn/ui + recharts |
| Hosting | Vercel (frontend) + Dokku (API) |
`,

  concepts: `
## Key Concepts

### Tempo

A **tempo** is the fundamental time unit in Bittensor. On the finney network, 1 tempo = **360 blocks** = **~72 minutes** (at 12 seconds per block). Data collection runs once per tempo.

### Subnets

Bittensor is divided into **subnets** (currently ~129), each identified by a \`netuid\`. Each subnet has its own set of miners and validators competing on a specific task.

### Roles

Every neuron in a subnet has one of three roles:

| Role | Determination | Description |
|------|--------------|-------------|
| **Owner** | \`coldkey == subnet_owner\` | The subnet creator/owner |
| **Validator** | \`validator_trust > 0\` | Evaluates miners and distributes rewards |
| **Miner** | Otherwise | Performs the subnet's task for rewards |

### Alpha Token & TAO

Each subnet has its own **alpha token** with a price in TAO. The \`alpha_price_tao\` field shows how much 1 alpha is worth in TAO.

### Daily TAO (Miner Earnings)

Estimated daily TAO earnings for miners, calculated as:

\`\`\`
daily_alpha = 360 × 0.41 × incentive × 20
daily_tao = daily_alpha × alpha_price_tao
\`\`\`

Where:
- **360** = alpha tokens per epoch (1 per block × 360 blocks)
- **0.41** = miner emission split (41% of subnet emissions go to miners)
- **incentive** = the neuron's incentive score (0-1)
- **20** = epochs per day (24h / 72min)

### Emission Value

The \`emission_value\` of a subnet represents its share of total network emissions:

\`\`\`
emission_value = tao_in_emission × 2
\`\`\`

Multiplied by 2 because dTAO emits both TAO-side and alpha-side emissions at equal value.

### Append-Only Data Model

All monitoring tables are **append-only**. Each collection run creates a new snapshot row with a \`collected_at\` timestamp. This preserves full history and allows time-series analysis. Queries typically use \`DISTINCT ON\` to get the latest snapshot per subnet/neuron.
`,

  api: `
## API Reference

Base URL: \`/api\`

All endpoints are **GET-only** and **read-only**. Responses are cached (10-30 min TTL) and rate-limited per IP.

### Dashboard

| Endpoint | Description |
|----------|-------------|
| \`GET /api/dashboard/status\` | System health: DB status, network, subnet/neuron counts, scheduler status |
| \`GET /api/dashboard/stats\` | Collection stats: runs 24h, errors 24h, last run timestamp |
| \`GET /api/dashboard/runs\` | Last 50 collection runs with status, rows inserted, duration |

**Example:** \`GET /api/dashboard/status\`
\`\`\`json
{
  "db_connected": true,
  "network": "finney",
  "total_subnets": 129,
  "total_neurons": 45200,
  "scheduler_running": true
}
\`\`\`

### Subnets

| Endpoint | Description |
|----------|-------------|
| \`GET /api/subnets\` | All subnets with latest overview + miner daily TAO totals |
| \`GET /api/subnets/{netuid}\` | Single subnet detail (name, emission, tempo, links, etc.) |
| \`GET /api/subnets/{netuid}/neurons\` | All neurons in a subnet (latest snapshot, max 1024) |
| \`GET /api/subnets/{netuid}/history?days=90\` | Subnet time-series: emission %, alpha price, register fee |
| \`GET /api/subnets/{netuid}/miner-history?days=90\` | Miner daily TAO history (1 row per miner per day) |

**Query Parameters:**
- \`days\` — History range in days. \`history\`: 1-365 (default 90). \`miner-history\`: 1-90 (default 90).

### Balances

| Endpoint | Description |
|----------|-------------|
| \`GET /api/balances\` | Latest TAO balance per tracked coldkey (max 500) |

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| \`/api/subnets\` | 10 req/min per IP |
| \`/api/subnets/{netuid}/miner-history\` | 10 req/min per IP |
| \`/api/subnets/{netuid}/neurons\` | 20 req/min per IP |
| \`/api/balances\` | 10 req/min per IP |
| All others | 30 req/min per IP |

Exceeding the limit returns **429 Too Many Requests**.

### Caching

All responses include \`Cache-Control\` headers. Cloudflare edge and in-memory caches serve most requests without hitting the database.

| Cache tier | TTL | Scope |
|-----------|-----|-------|
| Cloudflare edge | 10-30 min | Global CDN |
| In-memory (server) | 10 min (light), 30 min (heavy) | Per endpoint |

### Health Check

\`GET /health\` — Returns \`{"status": "ok"}\` if the API is running.
`,

  setup: `
## Setup Guide

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Installation

\`\`\`bash
git clone https://github.com/xom11/tao.git
cd tao

# Python dependencies
uv sync

# Frontend dependencies
cd web && npm install && cd ..

# Configure git hooks
git config core.hooksPath .githooks
\`\`\`

### Configuration

Create \`.env\` in the project root:

\`\`\`bash
BT_NETWORK=finney
DATABASE_URL=postgresql://user:password@localhost:5432/tao_db
TAOSTATS_API_KEY=          # optional
CORS_ORIGINS=http://localhost:3000
COLDKEYS=                  # optional, comma-separated
\`\`\`

Create \`web/.env.local\`:

\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

### Database Setup

\`\`\`bash
# Create database
createdb tao_db

# Initialize schema
just init-db
\`\`\`

### Running

You need 3 processes (use tmux or separate terminals):

\`\`\`bash
# 1. Data pipeline (scheduler)
just dev-scheduler

# 2. API backend (port 8000)
just dev-api

# 3. Frontend (port 3000)
just dev-web
\`\`\`

Or run API + frontend together:

\`\`\`bash
just dev
\`\`\`

### Manual Data Collection

\`\`\`bash
# Run all collectors once
just backfill

# Run specific collector
just backfill --collector metagraph
just backfill --collector metagraph --netuid 118
\`\`\`

### Database Schema

| Table | Type | Description | Frequency |
|-------|------|-------------|-----------|
| \`subnet_overview_snapshots\` | append-only | Subnet name, emission, alpha price, identity | ~72 min |
| \`metagraph_snapshots\` | append-only | All neurons: role, stake, incentive, daily TAO | ~72 min |
| \`coldkey_balances\` | append-only | TAO balance per coldkey | ~72 min |
| \`collection_runs\` | append-only | Audit log for each collector run | Automatic |
`,
} as const;

export const tabs = [
  { id: "overview", label: "Overview" },
  { id: "concepts", label: "Key Concepts" },
  { id: "api", label: "API Reference" },
  { id: "setup", label: "Setup" },
] as const;
