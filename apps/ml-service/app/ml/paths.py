"""Canonical artifact / dataset paths for the ML service.

Artifacts (trained models + metadata) live under ARTIFACTS_DIR and are the
ONLY thing the FastAPI service reads. Datasets live under DATA_DIR and are
consumed exclusively by training scripts.
"""

from pathlib import Path

from app.core.config import settings

CATEGORIES = ("maternal_risk", "gdm", "ppd", "mood")
TABULAR_CATEGORIES = ("maternal_risk", "gdm")
NLP_CATEGORIES = ("ppd", "mood")


def artifacts_root() -> Path:
    return settings.artifacts_path


def data_root() -> Path:
    return settings.data_path


def artifact_dir(category: str) -> Path:
    return artifacts_root() / category


def metadata_path(category: str) -> Path:
    return artifact_dir(category) / "metadata.json"


def model_file(category: str) -> Path:
    return artifact_dir(category) / "model.xgb"


def nlp_model_dir(category: str) -> Path:
    return artifact_dir(category) / "model"


def dataset_raw_dir(category: str) -> Path:
    return data_root() / category / "raw"


def dataset_processed_dir(category: str) -> Path:
    return data_root() / category / "processed"


def raw_dataset_path(category: str, filename: str = "dataset.csv") -> Path:
    return dataset_raw_dir(category) / filename


def is_tabular(category: str) -> bool:
    return category in TABULAR_CATEGORIES