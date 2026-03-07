# Bittensor Monitor

## Stack
- **Python** ≥ 3.12, package manager: **uv**
- **bittensor SDK** — thu thập dữ liệu on-chain
- **PostgreSQL** + psycopg3 — lưu trữ
- **APScheduler 3.x** — lịch chạy định kỳ
- **Pydantic-settings** — load config từ `.env`

## Triết lý theo dõi (2 tầng)

### Tầng 1 — Basic: tất cả subnets
Thu thập metagraph cơ bản cho **toàn bộ** subnets trên mạng, tự động mỗi tempo (~72 phút).
Các trường: uid, hotkey, coldkey, stake, validator_trust, consensus, incentive, dividends, emission, active.

### Tầng 2 — Detailed: subnets tham gia
Các subnet mà người dùng tham gia (validator/miner) được theo dõi **kỹ hơn**:
- Quan sát với tần suất cao hơn (TBD)
- Có thêm các trường mở rộng (TBD — sẽ thiết kế khi cần)
- Danh sách cấu hình qua `PARTICIPATED_SUBNET_NETUIDS` trong `.env`

> **Ghi chú:** Tầng 2 chưa implement. Tầng 1 đang hoạt động.

## Cấu trúc project
```
src/tao/
├── config.py          # Typed settings từ .env
├── db/
│   ├── connection.py  # Connection pool (psycopg_pool)
│   ├── schema.sql     # DDL — chạy qua scripts/init_db.py
│   └── queries/       # balance.py, subnet.py, metagraph.py, runs.py
├── collectors/
│   ├── base.py        # BaseCollector abstract: collect() → save() → log run
│   ├── subnet_overview.py   # Tất cả subnets overview
│   ├── metagraph.py         # Metagraph per subnet (dùng cho cả basic lẫn detailed)
│   ├── coldkey_balance.py
│   └── taostats.py    # placeholder
├── scheduler.py       # APScheduler jobs
└── main.py
scripts/
├── init_db.py         # Tạo schema lần đầu
└── backfill.py        # Chạy collector thủ công
```

## Lệnh hay dùng
```bash
uv sync                                              # cài dependencies
uv run python scripts/init_db.py                     # khởi tạo DB schema
uv run python scripts/backfill.py                    # chạy tất cả collectors
uv run python scripts/backfill.py --collector metagraph
uv run python scripts/backfill.py --collector metagraph --netuid 118
uv run python -m tao.main                            # chạy scheduler

# Quản lý subnets tầng 2
uv run python scripts/my_subnet.py list
uv run python scripts/my_subnet.py add --netuid 118 --coldkey 5Abc... --hotkey 5Def... --notes "..."
uv run python scripts/my_subnet.py edit --netuid 118 --notes "# New notes"
uv run python scripts/my_subnet.py show --netuid 118
uv run python scripts/my_subnet.py remove --netuid 118
```

## Config `.env`
```
BT_NETWORK=finney
WATCHED_SUBNET_NETUIDS=          # để trống = theo dõi tất cả (khuyến nghị)
                                  # hoặc: 1,18,64,118 để lọc subset
PARTICIPATED_SUBNET_NETUIDS=     # TBD — subnets tầng 2 (chưa dùng)
COLDKEYS=5Abc...,5Def...         # CSV, parse tự động
DATABASE_URL=postgresql://user:pass@localhost:5432/tao_db
TAOSTATS_API_KEY=...
```

## Schema DB

| Bảng | Loại | Mô tả | Tần suất |
|---|---|---|---|
| `subnet_overview_snapshots` | append-only | Overview tất cả subnets | 72 phút |
| `metagraph_snapshots` | append-only | Neuron data từng subnet | 72 phút |
| `coldkey_balances` | append-only | Balance coldkeys | 24 giờ |
| `collection_runs` | append-only | Audit log mỗi job | Tự động |
| `my_subnets` | **editable** | Config subnets tầng 2 | Thủ công |

### Bảng `my_subnets` (tầng 2)
Quản lý qua `scripts/my_subnet.py`. Các trường:
- `netuid` — PK
- `coldkey` — coldkey của mình trong subnet này
- `hotkey` — hotkey tương ứng
- `notes` — markdown tự do (mô tả, URL dashboard, role, ghi chú...)

## Conventions
- **Append-only DB**: chỉ INSERT, không UPDATE/DELETE. Mỗi lần chạy là snapshot mới.
- **Đơn vị**: bittensor SDK trả về `stake` và `emission` đã là TAO (float32). Cột DB đặt tên `_tao`.
- **Timestamp**: luôn UTC (`datetime.now(timezone.utc)`), cột kiểu `TIMESTAMPTZ`.
- **bt.Subtensor**: tạo một lần ở `main()`, truyền vào tất cả collectors — không tạo lại mỗi job.
- **Metagraph**: 1 job duy nhất loop tuần tự qua tất cả subnets (~129 subnets × 3s ≈ 6-7 phút/vòng).
- **Mỗi job** bọc try/except trong `BaseCollector.run()`, kết quả ghi vào bảng `collection_runs`.
- **pydantic-settings**: dùng `str` field + `@property` để parse CSV lists — không dùng `list[str]` trực tiếp (bị JSON-decode crash khi empty).

## Thêm collector mới
1. Tạo file `src/tao/collectors/ten_collector.py`, kế thừa `BaseCollector`
2. Implement `job_name`, `collect()`, `save()`
3. Tạo query file tương ứng trong `src/tao/db/queries/`
4. Thêm bảng vào `schema.sql` nếu cần
5. Đăng ký job trong `scheduler.py`
