from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "MaaSuraksha ML Service"
    APP_VERSION: str = "1.0.0"
    CORS_ORIGINS: str = "*"

    MODEL_DIR: str = "./models"
    ARTIFACTS_DIR: str = "./artifacts"
    DATA_DIR: str = "./data"

    # Shap explanations
    MAX_SHAP_FEATURES: int = 12

    @property
    def artifacts_path(self) -> Path:
        return Path(self.ARTIFACTS_DIR).resolve()

    @property
    def data_path(self) -> Path:
        return Path(self.DATA_DIR).resolve()

    @property
    def models_path(self) -> Path:
        return Path(self.MODEL_DIR).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()