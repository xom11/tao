# Bittensor Monitor

## Stack
- **Python** ≥ 3.12, package manager: **uv**
- **bittensor SDK** — thu thập dữ liệu on-chain
- **PostgreSQL** + psycopg3 — lưu trữ
- **APScheduler 3.x** — lịch chạy định kỳ
- **Pydantic-settings** — load config từ `.env`
- **FastAPI** + uvicorn — REST API backend (port 8000)
- **Next.js 14** + Tailwind + shadcn/ui + recharts — web frontend (port 3000)

## Triết lý theo dõi (2 tầng)

### Tầng 1 — Basic: tất cả subnets
Thu thập metagraph cơ bản cho **toàn bộ** subnets trên mạng, tự động mỗi tempo (~72 phút).
Các trường: uid, hotkey, coldkey, stake, validator_trust, consensus, incentive, dividends, emission, active, role, daily_tao.

### Tầng 2 — Detailed: subnets tham gia
Subnets mà người dùng tham gia (validator/miner), quản lý qua bảng `my_subnets`.
- Thêm/sửa/xoá qua web UI (`/my-subnets`) hoặc script CLI
- Hiển thị stake, incentive, emission realtime từ metagraph mới nhất

## Cấu trúc project
```
tao/
├── src/tao/           # Data pipeline
│   ├── config.py          # Typed settings từ .env
│   ├── db/
│   │   ├── connection.py  # Connection pool (psycopg_pool)
│   │   ├── schema.sql     # DDL — chạy qua scripts/init_db.py
│   │   └── queries/       # balance.py, subnet.py, metagraph.py, runs.py, my_subnets.py
│   ├── collectors/
│   │   ├── base.py        # BaseCollector abstract: collect() → save() → log run
│   │   ├── subnet_overview.py   # subnet name, symbol, emission, alpha price, identity
│   │   ├── metagraph.py         # neurons: role, daily_tao, stake, incentive...
│   │   ├── coldkey_balance.py
│   │   └── taostats.py    # placeholder
│   ├── scheduler.py       # APScheduler jobs
│   └── main.py
├── api/               # FastAPI backend
│   ├── main.py            # App, CORS, lifespan
│   ├── models.py          # Pydantic response schemas
│   └── routers/           # dashboard.py, subnets.py, metagraph.py, balances.py
├── web/               # Next.js 14 frontend
│   ├── app/               # dashboard, my-subnets, subnets/[netuid], balances pages
│   ├── components/
│   │   ├── tao/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── CollectionRunsTable.tsx
│   │   │   ├── SubnetTable.tsx        # sortable, miner_daily_tao column
│   │   │   ├── NeuronTable.tsx        # sortable, click-filter validator/miner
│   │   │   ├── MinerChart.tsx         # scatter plot daily TAO theo coldkey
│   │   │   ├── SubnetHistoryChart.tsx # line chart emission % + alpha price
│   │   │   ├── MySubnetsManager.tsx   # CRUD UI cho my_subnets
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── ui/            # badge, button, card, table, tabs, dialog, input, label, textarea
│   └── lib/               # api.ts, types.ts
└── scripts/
    ├── init_db.py         # Tạo schema lần đầu
    ├── backfill.py        # Chạy collector thủ công
    └── my_subnet.py       # Quản lý my_subnets qua CLI
```

## Lệnh hay dùng
```bash
# Setup
uv sync                                              # cài Python deps
cd web && npm install && cd ..                       # cài Node deps

# Data pipeline
uv run python scripts/init_db.py                     # khởi tạo DB schema (lần đầu)
uv run python scripts/migrate.py                     # thêm cột còn thiếu (sau khi pull code mới)
uv run python scripts/backfill.py                    # chạy tất cả collectors
uv run python scripts/backfill.py --collector metagraph
uv run python scripts/backfill.py --collector metagraph --netuid 118
uv run python -m tao.main                            # chạy scheduler (tự động)

# Web interface (dùng tmux để không bị ngắt)
uv run uvicorn api.main:app --reload --port 8000     # API backend
cd web && npm run dev                                # Frontend → http://localhost:3000

# Quản lý my_subnets qua CLI (hoặc dùng web UI tại /my-subnets)
uv run python scripts/my_subnet.py list
uv run python scripts/my_subnet.py add --netuid 118 --coldkey 5Abc... --hotkey 5Def... --notes "..."
uv run python scripts/my_subnet.py edit --netuid 118 --notes "# New notes"
uv run python scripts/my_subnet.py show --netuid 118
uv run python scripts/my_subnet.py remove --netuid 118
```

## Config `.env`
```
BT_NETWORK=finney
DATABASE_URL=postgresql://user:pass@localhost:5432/tao_db
TAOSTATS_API_KEY=...
```

## Schema DB

| Bảng | Loại | Mô tả | Tần suất |
|---|---|---|---|
| `subnet_overview_snapshots` | append-only | Overview tất cả subnets | ~72 phút |
| `metagraph_snapshots` | append-only | Neuron data từng subnet | ~72 phút |
| `coldkey_balances` | append-only | Balance coldkeys | 24 giờ |
| `collection_runs` | append-only | Audit log mỗi job | Tự động |
| `my_subnets` | **editable** | Subnets đang tham gia | Thủ công |

### Các cột quan trọng trong `metagraph_snapshots`
- `role` — `'validator'` nếu `validator_trust > 0`, ngược lại `'miner'`
- `daily_tao` — `(emission_tao / tempo) * 7200` — tính lúc collect, lưu vào DB

### Bảng `my_subnets`
- `netuid` — PK
- `coldkey`, `hotkey` — keys của mình trong subnet này
- `notes` — markdown tự do

## Web Interface

### API (`api/`)
- Chạy từ project root: `uv run uvicorn api.main:app --reload --port 8000`
- Import `tao` package qua `src/` (đã có trong uv path), `api/` module import trực tiếp
- Reuse pool từ `tao.db.connection.get_pool()` — không tạo pool riêng
- Mỗi router dùng `pool = get_pool()` ở đầu handler (pool đã khởi tạo qua lifespan)
- CORS cho phép `http://localhost:3000`

### API endpoints

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/dashboard/stats` | Runs 24h, errors, my_subnets count, last run |
| GET | `/api/dashboard/runs` | 50 collection runs gần nhất |
| GET | `/api/subnets` | Tất cả subnets + `miner_daily_tao` tổng |
| GET | `/api/subnets/{netuid}` | Chi tiết 1 subnet |
| GET | `/api/subnets/{netuid}/neurons` | Top 50 neurons theo stake |
| GET | `/api/subnets/{netuid}/history?days=90` | Time-series emission % + alpha price |
| GET | `/api/my-subnets` | My subnets + metagraph stats |
| PUT | `/api/my-subnets/{netuid}` | Thêm hoặc cập nhật (upsert) |
| DELETE | `/api/my-subnets/{netuid}` | Xoá |
| PATCH | `/api/my-subnets/{netuid}/notes` | Chỉ cập nhật notes |
| GET | `/api/balances` | Balance per coldkey |

### Frontend (`web/`)
- Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui
- Pages là Server Components (`async` function, fetch trực tiếp), trừ components cần state
- `export const dynamic = "force-dynamic"` trên mỗi page — không prerender tĩnh
- API URL cấu hình qua `web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- CSS: dùng HSL CSS vars chuẩn, **không** dùng `@import "tw-animate-css"` hay `@import "shadcn/tailwind.css"` (không tương thích Next.js 14 + Tailwind v3)
- Charts: `recharts` — AreaChart (history), ScatterChart (miner distribution)
- Radix UI primitives đã cài: `@radix-ui/react-tabs`, `@radix-ui/react-dialog`

### Thêm API endpoint mới
1. Thêm route vào router tương ứng trong `api/routers/`
2. Thêm Pydantic model vào `api/models.py` nếu cần
3. Thêm typed fetch wrapper vào `web/lib/api.ts`
4. Thêm TypeScript interface vào `web/lib/types.ts`

## Conventions
- **Append-only DB**: chỉ INSERT, không UPDATE/DELETE trên các bảng snapshot. Mỗi lần chạy là snapshot mới.
- **Đơn vị**: bittensor SDK trả về `stake` và `emission` đã là TAO (float32). Cột DB đặt tên `_tao`.
- **Timestamp**: luôn UTC (`datetime.now(timezone.utc)`), cột kiểu `TIMESTAMPTZ`.
- **bt.Subtensor**: tạo một lần ở `main()`, truyền vào tất cả collectors — không tạo lại mỗi job.
- **Metagraph**: 1 job duy nhất loop tuần tự qua tất cả subnets (~129 subnets × 3s ≈ 6-7 phút/vòng).
- **Mỗi job** bọc try/except trong `BaseCollector.run()`, kết quả ghi vào bảng `collection_runs`.
- **pydantic-settings**: dùng `str` field + `@property` để parse CSV lists — không dùng `list[str]` trực tiếp (bị JSON-decode crash khi empty).
- **Role**: `'validator'` nếu `validator_trust > 0`, ngược lại `'miner'` — lưu vào DB lúc collect.
- **daily_tao**: `(emission_tao / tempo) * 7200` — tính và lưu trong collector, không tính lại ở frontend (frontend fallback nếu null).
- **emission_value**: `float(s.tao_in_emission) * 2` — nhân đôi vì dTAO emit cả TAO side + alpha side.

## Thêm collector mới
1. Tạo file `src/tao/collectors/ten_collector.py`, kế thừa `BaseCollector`
2. Implement `job_name`, `collect()`, `save()`
3. Tạo query file tương ứng trong `src/tao/db/queries/`
4. Thêm bảng vào `schema.sql` nếu cần
5. Đăng ký job trong `scheduler.py`
