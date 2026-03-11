from abc import ABC, abstractmethod
from datetime import datetime, timezone

from psycopg_pool import ConnectionPool


class BaseCollector(ABC):
    def __init__(self, pool: ConnectionPool) -> None:
        self.pool = pool

    @property
    @abstractmethod
    def job_name(self) -> str: ...

    @abstractmethod
    def collect(self) -> list[dict]: ...

    @abstractmethod
    def save(self, data: list[dict]) -> int: ...

    def run(self) -> bool:
        """Run collect + save. Returns True on success, False on error."""
        from tao.db.queries import runs  # lazy import

        started_at = datetime.now(timezone.utc)
        status = "success"
        rows_inserted = 0
        error_message = None

        try:
            data = self.collect()
            rows_inserted = self.save(data)
            print(f"[{self.job_name}] OK — {rows_inserted} rows inserted")
            return True
        except Exception as e:
            status = "error"
            error_message = str(e)
            print(f"[{self.job_name}] ERROR — {e}")
            return False
        finally:
            finished_at = datetime.now(timezone.utc)
            runs.insert_run(
                self.pool,
                self.job_name,
                status,
                rows_inserted,
                error_message,
                started_at,
                finished_at,
            )
