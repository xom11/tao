# Bittensor Monitor

## Stack
- **Python** ≥ 3.12, package manager: **uv**
- **bittensor SDK** — thu thập dữ liệu on-chain
- **PostgreSQL** + psycopg3 — lưu trữ
- **APScheduler 3.x** — lịch chạy định kỳ
- **Pydantic-settings** — load config từ `.env`

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
│   ├── subnet_overview.py
│   ├── metagraph.py
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
uv run python scripts/backfill.py --collector metagraph --netuid 118
uv run python -m tao.main                            # chạy scheduler
```

## Conventions
- **Append-only DB**: chỉ INSERT, không UPDATE/DELETE. Mỗi lần chạy là snapshot mới.
- **Đơn vị**: bittensor trả về `rao`, lưu DB bằng `TAO` (chia `1_000_000_000`). Cột DB đặt tên `_tao`.
- **Timestamp**: luôn UTC (`datetime.now(timezone.utc)`), cột kiểu `TIMESTAMPTZ`.
- **bt.Subtensor**: tạo một lần ở `main()`, truyền vào tất cả collectors — không tạo lại mỗi job.
- **Metagraph jobs**: chạy tuần tự, stagger 5 phút/subnet để tránh spike.
- **Mỗi job** bọc try/except trong `BaseCollector.run()`, kết quả ghi vào bảng `collection_runs`.

## Config `.env`
```
BT_NETWORK=finney
WATCHED_SUBNET_NETUIDS=1,18,64,118   # CSV, parse tự động
COLDKEYS=5Abc...,5Def...             # CSV
DATABASE_URL=postgresql://user:pass@localhost:5432/tao_db
TAOSTATS_API_KEY=...
```

## Thêm collector mới
1. Tạo file `src/tao/collectors/ten_collector.py`, kế thừa `BaseCollector`
2. Implement `job_name`, `collect()`, `save()`
3. Tạo query file tương ứng trong `src/tao/db/queries/`
4. Thêm bảng vào `schema.sql` nếu cần
5. Đăng ký job trong `scheduler.py`
