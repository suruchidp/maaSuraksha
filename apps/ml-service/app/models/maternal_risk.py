"""Maternal Health Risk Prediction (XGBoost + SHAP).

Works ONLY on a real artifact produced by scripts/train_maternal_risk.py.
When the artifact is absent the service reports MODEL_UNAVAILABLE and never
invents a risk score or SHAP values.
"""

import logging
from typing import Any

import numpy as np

from app.ml import paths, tabular
from app.ml.exceptions import InvalidInputError, ModelUnavailableError
from app.ml.shap_explainer import compute_shap_values
from app.models.base_model import BaseModelService

logger = logging.getLogger(__name__)

DEFAULT_HIGH_RISK_THRESHOLD = 0.50


class MaternalRiskService(BaseModelService):
    def __init__(self) -> None:
        super().__init__("maternal_risk")
        self._model: Any | None = None
        self._defaults: dict[str, float] | None = None

    def _load(self) -> Any:
        if self._model is not None:
            return self._model
        md = self.ensure_available()
        path = paths.model_file(self.name)
        try:
            from xgboost import XGBClassifier

            clf = XGBClassifier()
            clf.load_model(str(path))
            self._model = clf
            self._defaults = {
                name: float(value)
                for name, value in (md.get("defaults") or {}).items()
            }
            logger.info("Loaded maternal_risk model %s from %s", md.get("version"), path)
            return clf
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Failed to load maternal_risk model: %s", exc)
            self._model = None
            raise ModelUnavailableError(f"failed to load maternal_risk artifact: {exc}")

    def _risk_level(self, probability: float, md: dict[str, Any]) -> str:
        thresholds = md.get("thresholds") or {}
        high_cut = float(thresholds.get("high_risk", DEFAULT_HIGH_RISK_THRESHOLD))
        critical_cut = float(thresholds.get("critical_risk", 0.85))
        if probability >= critical_cut:
            return "critical"
        if probability >= high_cut:
            return "high"
        return "low"

    def predict(self, input_data: Any) -> dict[str, Any]:
        try:
            md = self._load()
        except ModelUnavailableError:
            return self.unavailable_payload()

        try:
            matrix, names = tabular.row_to_matrix(
                input_data.model_dump(), self.name, self._defaults
            )
        except InvalidInputError as exc:
            return {
                **self.unavailable_payload(f"Invalid input: {exc}"),
            }

        probability = float(md.predict_proba(matrix)[0][1])
        risk_level = self._risk_level(probability, self.metadata or {})
        shap_values = compute_shap_values(
            md.get_booster(), matrix, names, max_features=10
        )
        return {
            "model_status": "MODEL_AVAILABLE",
            "prediction": "high" if risk_level in ("high", "critical") else "low",
            "probability": round(probability, 6),
            "risk_level": risk_level,
            "shap_values": shap_values,
            "model_version": self.model_version,
            "message": f"Maternal risk prediction completed (model {self.model_version}).",
        }