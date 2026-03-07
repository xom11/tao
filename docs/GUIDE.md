# Bittensor Monitor — Data Pipeline Design

## Mục tiêu

Thu thập định kỳ dữ liệu từ Bittensor network, lưu vào PostgreSQL, phục vụ việc theo dõi subnet, metagraph và balance của coldkey.

---

## 1. Cấu trúc thư mục

```
tao/
├── .env
├── .env.example
├── pyproject.toml
├── docs/
│   └── GUIDE.md
├── src/tao/
│   ├── config.py                  # Load .env, typed settings (Pydantic)
│   ├── db/
│   │   ├── connection.py          # PostgreSQL connection pool (psycopg3)
│   │   ├── schema.sql             # DDL tạo bảng
│   │   └── queries/
│   │       ├── subnet.py
│   │       ├── metagraph.py
│   │       └── balance.py
│   ├── collectors/
│   │   ├── base.py                # BaseCollector abstract class
│   │   ├── subnet_overview.py     # get_all_subnets_info()
│   │   ├── metagraph.py           # metagraph(netuid) per watched subnet
│   │   ├── coldkey_balance.py     # get_balance(coldkey)
│   │   └── taostats.py            # TaoStats REST API
│   ├── scheduler.py               # APScheduler jobs
│   └── main.py                    # Entrypoint
└── scripts/
    ├── init_db.py                 # Tạo schema lần đầu
    └── backfill.py                # Thu thập thủ công
```

---

## 2. Config `.env`

```env
BT_NETWORK=finney
WATCHED_SUBNET_NETUIDS=1,18,64,118
COLDKEYS=5Abc...,5Def...
DATABASE_URL=postgresql://user:password@localhost:5432/tao_db
TAOSTATS_API_KEY=your_key
```

`config.py` dùng Pydantic để parse và validate các biến này thành typed settings object.

---

## 3. PostgreSQL Schema

Nguyên tắc: **append-only** — chỉ INSERT, không UPDATE. Mọi bảng có `collected_at TIMESTAMPTZ DEFAULT NOW()`.

### `coldkey_balances`
Lưu balance của từng coldkey, thu thập hàng ngày.

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGSERIAL PK | |
| coldkey | TEXT | SS58 address |
| balance_tao | NUMERIC(20,9) | Đã convert từ rao |
| collected_at | TIMESTAMPTZ | |

### `subnet_overview_snapshots`
Snapshot tất cả subnet, thu thập mỗi tempo (~72 phút).

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGSERIAL PK | |
| netuid | INTEGER | |
| owner | TEXT | Coldkey chủ subnet |
| max_neurons | INTEGER | |
| emission_value | NUMERIC | Rao/block |
| tempo | INTEGER | |
| collected_at | TIMESTAMPTZ | |

### `metagraph_snapshots`
Snapshot từng neuron trong subnet được theo dõi, thu thập mỗi tempo.

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGSERIAL PK | |
| netuid | INTEGER | |
| uid | INTEGER | Neuron UID |
| hotkey | TEXT | |
| coldkey | TEXT | |
| stake_tao | NUMERIC(20,9) | |
| trust | FLOAT | |
| consensus | FLOAT | |
| incentive | FLOAT | |
| dividends | FLOAT | |
| emission_tao | NUMERIC(20,9) | |
| active | BOOLEAN | |
| collected_at | TIMESTAMPTZ | |

### `collection_runs`
Audit log mỗi job run.

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | BIGSERIAL PK | |
| job_name | TEXT | vd. "subnet_overview", "metagraph_18" |
| status | TEXT | "success" / "error" |
| rows_inserted | INTEGER | |
| error_message | TEXT | NULL nếu thành công |
| started_at | TIMESTAMPTZ | |
| finished_at | TIMESTAMPTZ | |

---

## 4. Collectors

| Collector | Data source | Tần suất | Bảng đích |
|---|---|---|---|
| `SubnetOverviewCollector` | `bt.Subtensor.get_all_subnets_info()` | 72 phút | `subnet_overview_snapshots` |
| `MetagraphCollector` | `bt.Subtensor.metagraph(netuid)` | 72 phút | `metagraph_snapshots` |
| `ColdkeyBalanceCollector` | `bt.Subtensor.get_balance(coldkey)` | 24 giờ | `coldkey_balances` |
| `TaoStatsCollector` | TaoStats REST API | TBD | TBD |

`BaseCollector` abstract class định nghĩa interface chung:
- `collect()` → thu thập và trả về data
- `save(data)` → INSERT vào DB
- `run()` → gọi collect + save, bọc try/except, ghi `collection_runs`

---

## 5. Scheduler (APScheduler)

Dùng `APScheduler` với `BlockingScheduler` hoặc `AsyncScheduler`.

| Job | Trigger | Interval |
|---|---|---|
| `subnet_overview` | interval | 72 phút |
| `metagraph_{netuid}` (mỗi subnet) | interval | 72 phút, stagger 5 phút/subnet |
| `coldkey_balances` | interval | 24 giờ |

**Stagger metagraph jobs:** nếu theo dõi subnet 1, 18, 64, 118 thì:
- subnet 1 chạy tại T+0
- subnet 18 chạy tại T+5 phút
- subnet 64 chạy tại T+10 phút
- subnet 118 chạy tại T+15 phút

Metagraph jobs chạy **tuần tự** (không song song) để tránh quá tải node.

---

## 6. Dependencies

Thêm vào `pyproject.toml`:

```toml
dependencies = [
    "bittensor",
    "psycopg[binary]>=3.1",
    "apscheduler>=3.10",
    "python-dotenv>=1.0",
    "httpx>=0.27",
    "pydantic>=2.0",
]
```

---

## 7. Lưu ý quan trọng

- **Đơn vị RAO vs TAO:** Bittensor SDK trả về giá trị theo đơn vị `rao`. Phải chia cho `10^9` trước khi lưu vào DB (`balance_tao = rao_value / 1_000_000_000`).
- **Tái sử dụng `bt.Subtensor`:** Tạo một instance duy nhất khi khởi động, chia sẻ cho tất cả collectors. Không tạo lại mỗi lần chạy job.
- **Timezone:** Luôn lưu timestamp UTC (`TIMESTAMPTZ`). Không dùng timezone local.
- **Append-only:** Không UPDATE hay DELETE. Mỗi lần chạy là một snapshot mới.
- **Error isolation:** Lỗi ở một collector không được làm crash scheduler. Mỗi job bọc `try/except` riêng.

---

## 8. Luồng khởi động (`main.py`)

```
1. Load config từ .env
2. Kết nối PostgreSQL (tạo connection pool)
3. Tạo bt.Subtensor instance
4. Khởi tạo tất cả collectors với shared subtensor + db pool
5. Đăng ký jobs vào APScheduler
6. Chạy scheduler (blocking)
```

---

## 9. Verification checklist

Sau khi implement xong:

1. `python scripts/init_db.py` → kiểm tra 4 bảng được tạo trong PostgreSQL
2. Chạy từng collector riêng lẻ → kiểm tra rows xuất hiện trong DB
3. Chạy scheduler 10 phút → kiểm tra bảng `collection_runs` có entries với `status = 'success'`
4. Kiểm tra giá trị balance: đảm bảo đơn vị là TAO (không phải rao)
