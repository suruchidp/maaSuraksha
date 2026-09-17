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


# The Maternal Risk model is trained ONLY on the six predictors present in the
# official UCI Maternal Health Risk dataset. BMI, gestational week and
# hemoglobin continue to exist in patient records / DTOs, but they are NOT
# features of this trained model and are never passed to XGBoost.
MATERNAL_RISK_FEATURES: list[FeatureSpec] = [
    FeatureSpec("age"),
    FeatureSpec("systolic_bp"),
    FeatureSpec("diastolic_bp"),
    FeatureSpec("blood_sugar"),
    FeatureSpec("body_temp"),
    FeatureSpec("heart_rate"),
]

# The GDM model is an EARLY RISK / decision-support model (Stage 1 of the
# two-stage maternal-care workflow). It uses ONLY variables from the local
# GDM-Final2022 dataset that can reasonably be available BEFORE diagnostic
# glucose testing. OGTT (a diagnostic glucose test) and Prediabetes (an
# ~87%-correlated leakage column) are intentionally NOT features; Case Number
# is an identifier. Fasting/postprandial glucose and HbA1c remain optional
# CLINICAL measurements in the app but are NOT model features (they exist
# only in Stage 2 clinical records, and are never fabricated or incorrectly
# mapped from this dataset).
GDM_FEATURES: list[FeatureSpec] = [
    FeatureSpec("age"),
    FeatureSpec("bmi"),
    FeatureSpec("hdl"),
    FeatureSpec("pregnancy_count"),
    FeatureSpec("previous_pregnancy_gestation"),
    FeatureSpec("family_history", kind="bool"),
    FeatureSpec("unexplained_prenatal_loss", kind="bool"),
    FeatureSpec("large_child_or_birth_defect", kind="bool"),
    FeatureSpec("pcos", kind="bool"),
    FeatureSpec("systolic_bp"),
    FeatureSpec("diastolic_bp"),
    FeatureSpec("hemoglobin"),
    FeatureSpec("sedentary_lifestyle", kind="bool"),
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
        if isinstance(value, float) and np.isnan(value):
            return float(feature.default or 0.0)
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
        if defaults is not None and (
            value is None or (isinstance(value, float) and np.isnan(value))
        ):
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


def defaults_from_frame(df: pd.DataFrame, category: str) -> dict[str, float]:
    """Per-feature median imputation values fitted on the supplied frame.

    Callers MUST pass the TRAINING split only: each median is computed over the
    finite (non-null) values of that split, so imputation learns nothing from
    validation/test rows and cannot leak. The same values are then used to fill
    missing values in train/val/test during training and serialized as
    `defaults` for inference.
    """
    names = feature_names(category)
    defaults: dict[str, float] = {}
    for name in names:
        with np.errstate(invalid="ignore"):
            col = df[name].to_numpy(dtype=float)
        finite = col[np.isfinite(col)]
        defaults[name] = float(np.median(finite)) if finite.size else 0.0
    return defaults


def validate_raw_values(values: dict[str, Any], category: str) -> None:
    """Apply a minimal sanity pass on raw row values (used by training loaders)."""
    for feature in FEATURE_SPECS[category]:
        value = values.get(feature.name)
        if value is None and feature.required:
            raise InvalidInputError(f"raw input missing required feature '{feature.name}'")