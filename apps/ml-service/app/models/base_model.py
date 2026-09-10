"""Base class for model services.

A model service is a thin wrapper around model inference ON REAL ARTIFACTS.
It never synthesises predictions. When the artifact is missing or invalid the
service reports MODEL_UNAVAILABLE with an explanatory message and returns
prediction fields as None.
"""

import logging
from typing import Any

from app.ml import artifact_store
from app.ml.exceptions import ModelUnavailableError

logger = logging.getLogger(__name__)


class BaseModelService:
    name: str = ""

    def __init__(self, name: str) -> None:
        self.name = name
        self._metadata: dict[str, Any] | None = None
        self._load_attempted = False

    @property
    def metadata(self) -> dict[str, Any] | None:
        if self._metadata is None and not self._load_attempted:
            self._metadata = artifact_store.read_metadata(self.name)
            self._load_attempted = True
        return self._metadata

    @property
    def model_version(self) -> str | None:
        md = self.metadata
        return md.get("version") if md else None

    def artifact_available(self) -> bool:
        return artifact_store.is_available(self.name)

    def get_status(self) -> str:
        return "MODEL_AVAILABLE" if self.artifact_available() else "MODEL_UNAVAILABLE"

    def status_detail(self) -> dict[str, Any]:
        available, reason = artifact_store.artifact_status(self.name)
        md = self.metadata or {}
        return {
            "model_status": "MODEL_AVAILABLE" if available else "MODEL_UNAVAILABLE",
            "reason": reason or None,
            "version": md.get("version"),
            "artifact_type": md.get("artifact_type"),
            "model_name": md.get("model_name"),
            "trained_at": md.get("trained_at"),
        }

    def ensure_available(self) -> dict[str, Any]:
        artifact_store.ensure_available(self.name)
        md = self.metadata or {}
        return md

    def unavailable_reason(self) -> str:
        available, reason = artifact_store.artifact_status(self.name)
        if available:
            return ""
        return (
            f"Model '{self.name}' is not available for inference: {reason}. "
            "Train the model with the dataset + training scripts described in "
            "docs/DATASETS.md and place the resulting artifact under "
            "artifacts/ to enable real inference. "
            "No predictions are fabricated while the model is unavailable."
        )

    def raise_if_unavailable(self) -> None:
        available, reason = artifact_store.artifact_status(self.name)
        if not available:
            raise ModelUnavailableError(reason)

    def unavailable_payload(self, message: str | None = None) -> dict[str, Any]:
        return {
            "model_status": "MODEL_UNAVAILABLE",
            "prediction": None,
            "probability": None,
            "risk_level": None,
            "shap_values": None,
            "model_version": None,
            "message": message or self.unavailable_reason(),
        }