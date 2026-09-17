import os
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
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

    # Laptop-safe training: bounded XGBoost thread count. Default 2 so a 16 GB
    # CPU-only machine is not saturated; override with MAASURAKSHA_ML_THREADS.
    MAASURAKSHA_ML_THREADS: int = 2

    @field_validator("MAASURAKSHA_ML_THREADS")
    @classmethod
    def _clamp_ml_threads(cls, value: int) -> int:
        value = int(value)
        max_threads = max(1, os.cpu_count() or 1)
        return max(1, min(value, max_threads))

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