#!/usr/bin/env python
"""Quản lý danh sách subnets tầng 2 (tham gia trực tiếp).

Ví dụ:
  uv run python scripts/my_subnet.py list
  uv run python scripts/my_subnet.py add --netuid 118 --coldkey 5Abc... --hotkey 5Def...
  uv run python scripts/my_subnet.py add --netuid 64 --coldkey 5Abc...
  uv run python scripts/my_subnet.py edit --netuid 118 --notes "# Subnet 118 (Cortex)
URL dashboard: https://...
Role: validator
"
  uv run python scripts/my_subnet.py show --netuid 118
  uv run python scripts/my_subnet.py remove --netuid 118
"""
import argparse
import sys

from tao.db.connection import close_pool, get_pool
from tao.db.queries import my_subnets as db


def cmd_list(pool, _args) -> None:
    rows = db.list_all(pool)
    if not rows:
        print("Chưa có subnet nào. Dùng: my_subnet.py add --netuid <N>")
        return
    print(f"{'netuid':>6}  {'coldkey':>20}  {'hotkey':>20}  {'updated_at'}")
    print("-" * 80)
    for r in rows:
        coldkey = (r["coldkey"] or "—")[:20]
        hotkey  = (r["hotkey"]  or "—")[:20]
        print(f"{r['netuid']:>6}  {coldkey:>20}  {hotkey:>20}  {r['updated_at']}")


def cmd_add(pool, args) -> None:
    if args.netuid is None:
        print("ERROR: --netuid bắt buộc")
        sys.exit(1)
    db.upsert(pool, args.netuid, coldkey=args.coldkey, hotkey=args.hotkey, notes=args.notes)
    print(f"OK — subnet {args.netuid} đã được thêm/cập nhật.")


def cmd_edit(pool, args) -> None:
    if args.netuid is None:
        print("ERROR: --netuid bắt buộc")
        sys.exit(1)
    db.upsert(pool, args.netuid, coldkey=args.coldkey, hotkey=args.hotkey, notes=args.notes)
    print(f"OK — subnet {args.netuid} đã cập nhật.")


def cmd_show(pool, args) -> None:
    if args.netuid is None:
        print("ERROR: --netuid bắt buộc")
        sys.exit(1)
    row = db.get(pool, args.netuid)
    if not row:
        print(f"Không tìm thấy subnet {args.netuid}.")
        return
    print(f"Netuid    : {row['netuid']}")
    print(f"Coldkey   : {row['coldkey'] or '—'}")
    print(f"Hotkey    : {row['hotkey'] or '—'}")
    print(f"Updated   : {row['updated_at']}")
    print(f"\n--- Notes ---\n{row['notes'] or '(trống)'}")


def cmd_remove(pool, args) -> None:
    if args.netuid is None:
        print("ERROR: --netuid bắt buộc")
        sys.exit(1)
    with pool.connection() as conn:
        conn.execute("DELETE FROM my_subnets WHERE netuid = %s", (args.netuid,))
    print(f"OK — subnet {args.netuid} đã xoá.")


COMMANDS = {
    "list":   cmd_list,
    "add":    cmd_add,
    "edit":   cmd_edit,
    "show":   cmd_show,
    "remove": cmd_remove,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Quản lý subnets tầng 2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("command", choices=COMMANDS.keys())
    parser.add_argument("--netuid",  type=int)
    parser.add_argument("--coldkey", type=str)
    parser.add_argument("--hotkey",  type=str)
    parser.add_argument("--notes",   type=str, help="Markdown tự do")
    args = parser.parse_args()

    pool = get_pool()
    try:
        COMMANDS[args.command](pool, args)
    finally:
        close_pool()


if __name__ == "__main__":
    main()
