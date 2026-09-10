"""SHAP explanations for tabular XGBoost models.

SHAP values are only computed from a REAL, LOADED, trained model. If model
loading, shap import, or the explainer computation fails for any reason we
return None instead of inventing values. The service is explicitly honest:
no shap_values are ever fabricated.
"""

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def compute_shap_values(
    model: Any,
    features: np.ndarray,
    feature_names: list[str],
    max_features: int = 12,
) -> dict[str, float] | None:
    """Return {feature: shap_value} for a single-row prediction, or None."""
    try:
        import shap

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(features)
        values = np.asarray(shap_values)
        if values.size == 0:
            return None
        # Binary classifiers can return a 2-element list [negative, positive].
        if values.ndim == 3 and values.shape[2] == 2:
            values = values[..., 1]
        elif values.ndim == 3:
            values = values[..., 0]
        # For a single-row matrix, expect shape (1, n_features).
        if values.ndim == 2 and values.shape[0] == 1:
            values = values[0]
        values = values.ravel()
        if len(values) != len(feature_names):
            logger.warning("SHAP value length does not match feature count; ignoring")
            return None
        ordered: list[tuple[str, float]] = sorted(
            zip(feature_names, [float(v) for v in values]),
            key=lambda item: abs(item[1]),
            reverse=True,
        )
        return {name: round(float(v), 6) for name, v in ordered[:max_features]}
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("SHAP computation failed: %s", exc)
        return None