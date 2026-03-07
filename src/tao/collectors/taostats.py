"""TaoStats REST API collector — placeholder for future implementation."""
import httpx
from psycopg_pool import ConnectionPool

from tao.collectors.base import BaseCollector
from tao.config import settings

TAOSTATS_BASE_URL = "https://api.taostats.io/api"


class TaoStatsCollector(BaseCollector):
    """Base class for collectors that use the TaoStats REST API."""

    def __init__(self, pool: ConnectionPool) -> None:
        super().__init__(pool)
        self._client: httpx.Client | None = None

    @property
    def job_name(self) -> str:
        return "taostats"

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(
                base_url=TAOSTATS_BASE_URL,
                headers={"Authorization": f"Bearer {settings.taostats_api_key}"},
                timeout=30.0,
            )
        return self._client

    def collect(self) -> list[dict]:
        # TODO: implement specific TaoStats endpoints
        raise NotImplementedError

    def save(self, data: list[dict]) -> int:
        # TODO: implement once collect() is defined
        raise NotImplementedError

    def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None
