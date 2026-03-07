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

    coldkeys_raw: str = Field("", validation_alias="coldkeys")

    @property
    def coldkeys(self) -> list[str]:
        return [x.strip() for x in self.coldkeys_raw.split(",") if x.strip()]


settings = Settings()
