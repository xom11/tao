# Tao Monitor

Công cụ theo dõi mạng Bittensor cá nhân. Thu thập dữ liệu on-chain định kỳ và hiển thị qua web interface.

## Yêu cầu

- Python ≥ 3.12, [uv](https://docs.astral.sh/uv/)
- Node.js ≥ 18, npm
- PostgreSQL (local hoặc remote)

---

## Cài đặt lần đầu

### 1. Clone & cài dependencies

```bash
git clone <repo>
cd tao
uv sync          # Python deps
cd web && npm install && cd ..
```

### 2. Tạo file `.env`

```bash
cp .env.example .env   # hoặc tạo thủ công
```

Nội dung `.env`:

```
BT_NETWORK=finney
DATABASE_URL=postgresql://user:pass@localhost:5432/tao_db
COLDKEYS=5Abc...,5Def...

# Để trống = theo dõi tất cả subnets (khuyến nghị)
WATCHED_SUBNET_NETUIDS=
```

### 3. Khởi tạo database

```bash
uv run python scripts/init_db.py
```

### 4. Thu thập dữ liệu lần đầu (backfill)

```bash
uv run python scripts/backfill.py
# hoặc chỉ một collector cụ thể:
uv run python scripts/backfill.py --collector metagraph --netuid 18
```

---

## Chạy hàng ngày

Cần 3 terminal (hoặc dùng tmux/screen):

```bash
# Terminal 1 — Data pipeline (scheduler tự động ~72 phút/vòng)
uv run python -m tao.main

# Terminal 2 — API backend
uv run uvicorn api.main:app --reload --port 8000

# Terminal 3 — Web frontend
cd web && npm run dev
```

Mở trình duyệt: **http://localhost:3000**

---

## Web interface

| Trang | URL | Mô tả |
|---|---|---|
| Dashboard | `/dashboard` | Stats 24h + lịch sử collection runs |
| My Subnets | `/my-subnets` | Subnets đang tham gia, stake/emission/incentive |
| All Subnets | `/subnets` | Toàn bộ subnets trên mạng |
| Subnet Detail | `/subnets/{netuid}` | Info + top 50 neurons theo stake |
| Balances | `/balances` | Balance các coldkey |

---

## Quản lý "My Subnets"

Đăng ký subnet để theo dõi chi tiết ở trang My Subnets:

```bash
# Thêm
uv run python scripts/my_subnet.py add \
  --netuid 18 \
  --coldkey 5Abc... \
  --hotkey 5Def... \
  --notes "Validator SN18, dashboard: https://..."

# Xem danh sách
uv run python scripts/my_subnet.py list

# Xem chi tiết 1 subnet
uv run python scripts/my_subnet.py show --netuid 18

# Cập nhật notes
uv run python scripts/my_subnet.py edit --netuid 18 --notes "# New notes"

# Xóa
uv run python scripts/my_subnet.py remove --netuid 18
```

---

## API endpoints

Backend chạy tại `http://localhost:8000`.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/dashboard/stats` | Runs 24h, errors, my_subnets count, last run |
| GET | `/api/dashboard/runs` | 50 collection runs gần nhất |
| GET | `/api/subnets` | Tất cả subnets (latest per netuid) |
| GET | `/api/subnets/{netuid}` | Chi tiết 1 subnet |
| GET | `/api/subnets/{netuid}/neurons` | Top 50 neurons theo stake |
| GET | `/api/my-subnets` | My subnets + metagraph stats |
| PATCH | `/api/my-subnets/{netuid}/notes` | Cập nhật notes |
| GET | `/api/balances` | Balance per coldkey |

Ví dụ:

```bash
curl http://localhost:8000/api/dashboard/stats | jq
curl http://localhost:8000/api/subnets | jq '.[0]'
curl http://localhost:8000/api/subnets/18/neurons | jq '.[0:3]'
```

---

## Cấu trúc project

```
tao/
├── src/tao/            # Data pipeline
│   ├── config.py
│   ├── db/             # connection, schema, queries
│   ├── collectors/     # subnet_overview, metagraph, coldkey_balance
│   ├── scheduler.py
│   └── main.py
├── api/                # FastAPI backend
│   ├── main.py
│   ├── models.py
│   └── routers/        # dashboard, subnets, metagraph, balances
├── web/                # Next.js 14 frontend
│   ├── app/            # dashboard, my-subnets, subnets, balances pages
│   ├── components/tao/ # StatsCards, tables
│   └── lib/            # api.ts, types.ts
└── scripts/
    ├── init_db.py
    ├── backfill.py
    └── my_subnet.py
```
