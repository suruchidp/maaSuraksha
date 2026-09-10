"""Gestational Diabetes Mellitus (GDM) Detection (XGBoost + SHAP).

Works ONLY on a real artifact produced by scripts/train_gdm.py. When the
artifact is absent the service reports MODEL_UNAVAILABLE and never invents
a probability or SHAP values.
"""

import logging
from typing import Any

from app.ml import paths, tabular
from app.ml.exceptions import InvalidInputError, ModelUnavailableError
from app.ml.shap_explainer import compute_shap_values
from app.models.base_model import BaseModelService

logger = logging.getLogger(__name__)

DEFAULT_POSITIVE_THRESHOLD = 0.50


class GDMService(BaseModelService):
    def __init__(self) -> None:
        super().__init__("gdm")
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
            logger.info("Loaded gdm model %s from %s", md.get("version"), path)
            return clf
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Failed to load gdm model: %s", exc)
            self._model = None
            raise ModelUnavailableError(f"failed to load gdm artifact: {exc}")

    def predict(self, input_data: Any) -> dict[str, Any]:
        try:
            model = self._load()
        except ModelUnavailableError:
            return self.unavailable_payload()

        try:
            matrix, names = tabular.row_to_matrix(
                input_data.model_dump(), self.name, self._defaults
            )
        except InvalidInputError as exc:
            return self.unavailable_payload(f"Invalid input: {exc}")

        md = self.metadata or {}
        thresholds = md.get("thresholds") or {}
        cut = float(thresholds.get("positive", DEFAULT_POSITIVE_THRESHOLD))

        probability = float(model.predict_proba(matrix)[0][1])
        positive = probability >= cut
        shap_values = compute_shap_values(
            model.get_booster(), matrix, names, max_features=10
        )
        return {
            "model_status": "MODEL_AVAILABLE",
            "prediction": "positive" if positive else "negative",
            "probability": round(probability, 6),
            "risk_level": "high" if positive else "low",
            "shap_values": shap_values,
            "model_version": self.model_version,
            "message": f"GDM detection completed (model {self.model_version}).",
        }