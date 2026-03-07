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
uv sync                          # Python deps
cd web && npm install && cd ..   # Node deps
```

### 2. Tạo file `.env`

```
BT_NETWORK=finney
DATABASE_URL=postgresql://user:pass@localhost:5432/tao_db
```

### 3. Khởi tạo database

```bash
uv run python scripts/init_db.py
```

### 4. Thu thập dữ liệu lần đầu

```bash
uv run python scripts/backfill.py
# hoặc chỉ một collector cụ thể:
uv run python scripts/backfill.py --collector metagraph --netuid 18
```

---

## Chạy hàng ngày

Dùng tmux để không bị ngắt khi đóng terminal (máy sleep sẽ tạm dừng — dùng `caffeinate -i` nếu cần chạy liên tục):

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
| My Subnets | `/my-subnets` | Quản lý subnets đang tham gia (CRUD) |
| All Subnets | `/subnets` | Toàn bộ subnets, có cột Miner Daily TAO |
| Subnet Detail | `/subnets/{netuid}` | 3 tabs: Metagraph · Miner Chart · History |
| Balances | `/balances` | Balance các coldkey |

### Subnet Detail — 3 tabs

- **Metagraph**: Bảng neurons với sort theo cột, click card để filter validator/miner, hiện `X/Y earning`
- **Miner Chart**: Scatter plot daily TAO theo coldkey — một coldkey nhiều hotkey = nhiều chấm cùng hàng
- **History**: Line chart emission % và alpha price theo thời gian (7d / 30d / All)

---

## Quản lý "My Subnets"

Hai cách để thêm/sửa/xoá subnet đang tham gia:

**Cách 1 — Web UI** (khuyến nghị): vào `/my-subnets`, nhấn "Add Subnet"

**Cách 2 — CLI**:
```bash
uv run python scripts/my_subnet.py add \
  --netuid 18 \
  --coldkey 5Abc... \
  --hotkey 5Def... \
  --notes "Validator SN18"

uv run python scripts/my_subnet.py list
uv run python scripts/my_subnet.py edit --netuid 18 --notes "updated notes"
uv run python scripts/my_subnet.py remove --netuid 18
```

---

## API endpoints

Backend chạy tại `http://localhost:8000`.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/dashboard/stats` | Runs 24h, errors, my_subnets count, last run |
| GET | `/api/dashboard/runs` | 50 collection runs gần nhất |
| GET | `/api/subnets` | Tất cả subnets + tổng miner daily TAO |
| GET | `/api/subnets/{netuid}` | Chi tiết 1 subnet |
| GET | `/api/subnets/{netuid}/neurons` | Top 50 neurons theo stake |
| GET | `/api/subnets/{netuid}/history?days=90` | Time-series emission % + alpha price |
| GET | `/api/my-subnets` | My subnets + metagraph stats |
| PUT | `/api/my-subnets/{netuid}` | Thêm hoặc cập nhật subnet |
| DELETE | `/api/my-subnets/{netuid}` | Xoá subnet |
| GET | `/api/balances` | Balance per coldkey |

```bash
# Ví dụ
curl http://localhost:8000/api/dashboard/stats | jq
curl http://localhost:8000/api/subnets/18/history?days=7 | jq '.[0]'
```

---

## Cấu trúc project

```
tao/
├── src/tao/            # Data pipeline
│   ├── config.py
│   ├── db/             # connection, schema.sql, queries/
│   ├── collectors/     # subnet_overview, metagraph, coldkey_balance
│   ├── scheduler.py
│   └── main.py
├── api/                # FastAPI backend
│   ├── main.py
│   ├── models.py
│   └── routers/        # dashboard, subnets, metagraph, balances
├── web/                # Next.js 14 frontend
│   ├── app/            # pages
│   ├── components/
│   │   ├── tao/        # SubnetTable, NeuronTable, MinerChart, SubnetHistoryChart, MySubnetsManager, ...
│   │   └── ui/         # shadcn components
│   └── lib/            # api.ts, types.ts
└── scripts/
    ├── init_db.py
    ├── backfill.py
    └── my_subnet.py
```
