"""Tabular feature specifications and deterministic preprocessing.

The feature spec is shared by (a) the training scripts that fit default
imputation values on the training split and (b) the inference service that
uses those defaults at request time. Every step here is deterministic and
reproducible; nothing is fabricated at inference time.
"""

from dataclasses import dataclass
from typing import Any

import numpy as np

from app.ml.exceptions import InvalidInputError


@dataclass(frozen=True)
class FeatureSpec:
    name: str
    kind: str = "numeric"  # numeric | bool
    required: bool = True
    default: float | None = None  # imputation value learned at train time


MATERNAL_RISK_FEATURES: list[FeatureSpec] = [
    FeatureSpec("age"),
    FeatureSpec("systolic_bp"),
    FeatureSpec("diastolic_bp"),
    FeatureSpec("blood_sugar"),
    FeatureSpec("body_temp"),
    FeatureSpec("heart_rate"),
    FeatureSpec("bmi"),
    FeatureSpec("gestational_week"),
    FeatureSpec("hemoglobin", required=False),
]

GDM_FEATURES: list[FeatureSpec] = [
    FeatureSpec("age"),
    FeatureSpec("bmi"),
    FeatureSpec("fasting_glucose"),
    FeatureSpec("postprandial_glucose", required=False),
    FeatureSpec("hba1c", required=False),
    FeatureSpec("gestational_week"),
    FeatureSpec("family_history_diabetes", kind="bool"),
    FeatureSpec("previous_gdm", kind="bool"),
]

FEATURE_SPECS: dict[str, list[FeatureSpec]] = {
    "maternal_risk": MATERNAL_RISK_FEATURES,
    "gdm": GDM_FEATURES,
}


def feature_names(category: str) -> list[str]:
    return [f.name for f in FEATURE_SPECS[category]]


def _to_float(value: Any, feature: FeatureSpec) -> float:
    if value is None:
        if feature.default is None:
            raise InvalidInputError(
                f"missing value for required feature '{feature.name}'"
            )
        return float(feature.default)
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    try:
        result = float(value)
    except (TypeError, ValueError) as exc:
        raise InvalidInputError(
            f"feature '{feature.name}' must be numeric, got {value!r}"
        ) from exc
    if np.isnan(result):
        if feature.default is None:
            raise InvalidInputError(f"missing value for required feature '{feature.name}'")
        return float(feature.default)
    return result


def _to_bool(value: Any, feature: FeatureSpec) -> float:
    if value is None:
        return float(feature.default or 0.0)
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        return 1.0 if float(value) != 0 else 0.0
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "yes", "y", "t"}:
            return 1.0
        if lowered in {"0", "false", "no", "n", "f"}:
            return 0.0
    raise InvalidInputError(f"feature '{feature.name}' must be boolean, got {value!r}")


def row_to_matrix(
    row: dict[str, Any],
    category: str,
    defaults: dict[str, float] | None = None,
) -> tuple[np.ndarray, list[str]]:
    """Convert a dict of raw input values into an ordered feature matrix.

    `defaults` maps feature name -> imputation value (median from training).
    Missing required features without a default raise InvalidInputError.
    """
    spec = FEATURE_SPECS[category]
    out: list[float] = []
    for feature in spec:
        value = row.get(feature.name)
        if defaults is not None and value is None:
            value = defaults.get(feature.name)
        if feature.kind == "bool":
            out.append(_to_bool(value, feature))
        else:
            out.append(_to_float(value, feature))
    return np.asarray([out], dtype=np.float32).reshape(1, -1), feature_names(category)


def compute_defaults(data: np.ndarray, category: str) -> dict[str, float]:
    """Median imputation values computed from a training matrix (train split only).

    One median is computed per PROVIDED column; the value is attributed to the
    feature occupying that column index in the category's feature order.
    """
    names = feature_names(category)
    medians: dict[str, float] = {}
    for idx in range(data.shape[1]):
        col = data[:, idx]
        finite = col[np.isfinite(col)]
        medians[names[idx]] = float(np.median(finite)) if finite.size else 0.0
    return medians


def validate_raw_values(values: dict[str, Any], category: str) -> None:
    """Apply a minimal sanity pass on raw row values (used by training loaders)."""
    for feature in FEATURE_SPECS[category]:
        value = values.get(feature.name)
        if value is None and feature.required:
            raise InvalidInputError(f"raw input missing required feature '{feature.name}'")