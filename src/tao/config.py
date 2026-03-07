from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
    )

    bt_network: str = "finney"
    database_url: str = "postgresql://localhost/tao_db"
    taostats_api_key: str = ""

    # Store as raw CSV strings — pydantic-settings JSON-decodes list[...] fields
    # before validators run, crashing on empty strings like `COLDKEYS=`
    netuids_raw: str = Field("", validation_alias="watched_subnet_netuids")
    coldkeys_raw: str = Field("", validation_alias="coldkeys")

    @property
    def watched_subnet_netuids(self) -> list[int]:
        return [int(x.strip()) for x in self.netuids_raw.split(",") if x.strip()]

    @property
    def coldkeys(self) -> list[str]:
        return [x.strip() for x in self.coldkeys_raw.split(",") if x.strip()]


settings = Settings()
