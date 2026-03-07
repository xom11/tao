from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    bt_network: str = "finney"
    watched_subnet_netuids: list[int] = Field(default_factory=list)
    coldkeys: list[str] = Field(default_factory=list)
    database_url: str = "postgresql://localhost/tao_db"
    taostats_api_key: str = ""

    @field_validator("watched_subnet_netuids", mode="before")
    @classmethod
    def parse_netuids(cls, v: str | list) -> list[int]:
        if isinstance(v, str):
            return [int(x.strip()) for x in v.split(",") if x.strip()]
        return v

    @field_validator("coldkeys", mode="before")
    @classmethod
    def parse_coldkeys(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v


settings = Settings()
