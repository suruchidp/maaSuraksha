"""Unit conversion for the Maternal Risk model input boundary.

The MaaSuraksha user-facing (external/application) contract expresses the two
glucose- and temperature-related inputs in everyday clinical units:

    blood_sugar : mg/dL      (schema bounds 20..500)
    body_temp   : degrees Celsius (schema bounds 35..42)

The saved UCI Maternal Health Risk model (``scripts/train_maternal_risk.py``)
was trained on the raw dataset in its NATIVE units:

    blood_sugar : mmol/L     (training range ~6..19, median 7.5)
    body_temp   : degrees Fahrenheit (training range ~98..103, median 98.0)

The model artifact is deliberately NOT retrained and NOT modified. Instead the
application converts user-facing values into the model's native units exactly
once, at the model-input boundary (``MaternalRiskService.predict``), right
before the row is handed to XGBoost. Standard clinical formulas:

    mmol/L = mg/dL / 18
    °F     = °C * 9/5 + 32

Only USER-PROVIDED values are converted. Values that are absent (``None``) are
left untouched so the imputation layer fills them with the saved training-split
medians (metadata ``defaults``), which are ALREADY expressed in model units.
Defaults are therefore never re-converted, which guarantees there is no double
conversion in the serving pipeline. See ``docs/MATERNAL_RISK_UNIT_CONVERSION.md``.
"""

from typing import Any

#: Standard clinical conversion factor: 1 mmol/L == 18 mg/dL.
BLOOD_GLUCOSE_MG_DL_PER_MMOL_L = 18.0

#: Maternal Risk feature names converted at the boundary (match tabular specs).
BLOOD_SUGAR_FEATURE = "blood_sugar"
BODY_TEMP_FEATURE = "body_temp"


def blood_glucose_mg_dl_to_mmol_l(value: float) -> float:
    """Convert blood glucose from mg/dL to mmol/L (model units)."""
    return float(value) / BLOOD_GLUCOSE_MG_DL_PER_MMOL_L


def temperature_celsius_to_fahrenheit(value: float) -> float:
    """Convert body temperature from degrees Celsius to Fahrenheit (model units)."""
    return float(value) * 9.0 / 5.0 + 32.0


def to_maternal_model_units(row: dict[str, Any] | None) -> dict[str, Any]:
    """Return a COPY of the external-unit row with values converted to model units.

    - ``blood_sugar`` (mg/dL) -> mmol/L via ``mg/dL / 18``
    - ``body_temp`` (°C) -> °F via ``°C * 9/5 + 32``

    Non-destructive: the caller's dict is never mutated, so accidentally calling
    this function twice yields detectably different (wrong) values instead of
    silently "re-normalising" them — a built-in guard against double conversion.

    A ``None`` value (missing optional field) is left as ``None``: the imputation
    layer will fill it with the metadata default, which is already in model units.
    A non-numeric value is left unconverted so the row-to-matrix layer reports a
    clear ``InvalidInputError`` rather than an unhandled TypeError.
    """
    if not row:
        return dict(row or {})
    converted = dict(row)
    for feature, convert in (
        (BLOOD_SUGAR_FEATURE, blood_glucose_mg_dl_to_mmol_l),
        (BODY_TEMP_FEATURE, temperature_celsius_to_fahrenheit),
    ):
        value = converted.get(feature)
        if value is None or isinstance(value, bool):
            continue
        try:
            converted[feature] = convert(value)
        except (TypeError, ValueError):
            # Unconvertible -> leave raw; row_to_matrix raises InvalidInputError.
            continue
    return converted