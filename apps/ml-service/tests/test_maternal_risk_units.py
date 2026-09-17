"""Unit-conversion boundary tests for the Maternal Risk service.

The saved UCI Maternal Risk model is trained on blood glucose in mmol/L and
body temperature in degrees Fahrenheit, while the MaaSuraksha application
contract uses mg/dL and °C. Conversion happens exactly ONCE at the model-input
boundary (MaternalRiskService.predict -> app/ml/unit_conversion.py); the
artifact is unchanged. These tests pin the conversion maths and prove the model
receives the converted values.
"""

import numpy as np
import pytest

from app.ml import paths, tabular, unit_conversion
from app.models.maternal_risk import MaternalRiskService

VALID_MATERNAL = {
    "age": 28.0,
    "systolic_bp": 120.0,
    "diastolic_bp": 80.0,
    "blood_sugar": 90.0,  # mg/dL (external)
    "body_temp": 36.5,  # °C (external)
    "heart_rate": 72.0,
    "bmi": 23.5,
    "gestational_week": 20.0,
    "hemoglobin": 11.5,
}


class _Input:
    def __init__(self, data):
        self.data = data

    def model_dump(self):
        return dict(self.data)


@pytest.fixture
def capture_row_to_matrix(monkeypatch):
    """Wrap row_to_matrix to record the exact row/matrix the model receives."""
    from app.models import maternal_risk as mod

    captured: dict[str, object] = {}
    real = mod.tabular.row_to_matrix

    def _capturing(row, category, defaults=None):
        matrix, names = real(row, category, defaults)
        captured["row"] = dict(row)
        captured["matrix"] = matrix
        captured["names"] = names
        return matrix, names

    monkeypatch.setattr(mod.tabular, "row_to_matrix", _capturing)
    return captured


# ---------------------------------------------------------------------------
# 1. Conversion maths (the canonical formulas).
# ---------------------------------------------------------------------------


def test_blood_glucose_96_mg_dl_to_mmol_l():
    # 96 mg/dL / 18 = 5.333... mmol/L
    mmol = unit_conversion.blood_glucose_mg_dl_to_mmol_l(96.0)
    assert mmol == pytest.approx(5.33333333333333, rel=1e-9)
    # 90 mg/dL -> exactly 5.0 mmol/L
    assert unit_conversion.blood_glucose_mg_dl_to_mmol_l(90.0) == pytest.approx(5.0)


def test_body_temp_36_8_c_to_f():
    # 36.8 °C * 9/5 + 32 = 98.24 °F
    f = unit_conversion.temperature_celsius_to_fahrenheit(36.8)
    assert f == pytest.approx(98.24, rel=1e-6)
    # 37 °C -> exactly 98.6 °F
    assert unit_conversion.temperature_celsius_to_fahrenheit(37.0) == pytest.approx(98.6)


def test_conversion_module_pins_standard_formulas():
    assert unit_conversion.BLOOD_GLUCOSE_MG_DL_PER_MMOL_L == 18.0
    # 98.6 °F is the classic 37 °C marker
    assert unit_conversion.temperature_celsius_to_fahrenheit(37.0) == pytest.approx(98.6)


# ---------------------------------------------------------------------------
# 2. Boundary conversion behaviour.
# ---------------------------------------------------------------------------


def test_to_maternal_model_units_converts_only_sugar_and_temp():
    row = {
        "age": 28.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "blood_sugar": 96.0,
        "body_temp": 36.8,
        "heart_rate": 72.0,
    }
    out = unit_conversion.to_maternal_model_units(row)
    assert out["blood_sugar"] == pytest.approx(96.0 / 18.0)
    assert out["body_temp"] == pytest.approx(36.8 * 9.0 / 5.0 + 32.0)
    # All other features are untouched.
    assert out["age"] == 28.0
    assert out["systolic_bp"] == 120.0
    assert out["diastolic_bp"] == 80.0
    assert out["heart_rate"] == 72.0
    # Non-destructive: the caller's dict is never mutated.
    assert row["blood_sugar"] == 96.0
    assert row["body_temp"] == 36.8


def test_to_maternal_model_units_leaves_none_and_unconvertible_values():
    row = {"blood_sugar": None, "body_temp": None, "age": 28.0}
    out = unit_conversion.to_maternal_model_units(row)
    assert out["blood_sugar"] is None
    assert out["body_temp"] is None
    # Missing value -> imputation default (in MODEL units) later, not converted.
    bad = {"blood_sugar": "high", "body_temp": "hot"}
    out_bad = unit_conversion.to_maternal_model_units(bad)
    assert out_bad["blood_sugar"] == "high"
    assert out_bad["body_temp"] == "hot"


def test_no_double_conversion_never_idempotent():
    row = {"blood_sugar": 96.0, "body_temp": 36.8}
    once = unit_conversion.to_maternal_model_units(row)
    twice = unit_conversion.to_maternal_model_units(once)
    # A single boundary conversion yields the model units.
    assert once["blood_sugar"] == pytest.approx(96.0 / 18.0)
    assert once["body_temp"] == pytest.approx(36.8 * 9.0 / 5.0 + 32.0)
    # Double-applying is NOT a no-op: it is detectably different, so an
    # accidental second conversion of user values cannot hide silently.
    assert twice["blood_sugar"] != pytest.approx(once["blood_sugar"])
    assert twice["body_temp"] != pytest.approx(once["body_temp"])
    assert twice["blood_sugar"] != pytest.approx(96.0)
    assert twice["body_temp"] != pytest.approx(36.8)
    # And the service guarantees ONLY ONE conversion for provided values
    # (models receive 96 mg/dL as ~5.333, never ~0.296).


# ---------------------------------------------------------------------------
# 3. What the model actually receives (service-level, real mat build).
# ---------------------------------------------------------------------------


def test_model_receives_exactly_one_conversion(toy_maternal_risk, monkeypatch, capture_row_to_matrix):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()
    result = service.predict(
        _Input({**VALID_MATERNAL, "blood_sugar": 96.0, "body_temp": 36.8})
    )
    assert result["model_status"] == "MODEL_AVAILABLE"
    row = capture_row_to_matrix["row"]
    # The boundary conversion happened ONCE: model received mmol/L and °F.
    assert row["blood_sugar"] == pytest.approx(96.0 / 18.0)
    assert row["body_temp"] == pytest.approx(36.8 * 9.0 / 5.0 + 32.0)
    assert row["age"] == 28.0
    assert row["systolic_bp"] == 120.0
    matrix = capture_row_to_matrix["matrix"]
    assert matrix.shape == (1, 6)
    assert list(capture_row_to_matrix["names"]) == tabular.feature_names("maternal_risk")


def test_converted_value_is_inside_model_training_region():
    # The example from the bug report: 96 mg/dL and 36.8 °C land INSIDE the UCI
    # training ranges after conversion (mmol/L ~6-19, °F ~98-103), i.e. the
    # model is no longer fed out-of-distribution magnitudes.
    assert 5.0 < unit_conversion.blood_glucose_mg_dl_to_mmol_l(96.0) < 6.0
    assert 98.0 <= unit_conversion.temperature_celsius_to_fahrenheit(36.8) <= 99.0


def test_missing_values_use_model_unit_defaults_without_conversion(
    toy_maternal_risk, monkeypatch, capture_row_to_matrix
):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()
    no_sugar_temp = {k: v for k, v in VALID_MATERNAL.items() if k not in ("blood_sugar", "body_temp")}
    result = service.predict(_Input(no_sugar_temp))
    assert result["model_status"] == "MODEL_AVAILABLE"
    assert capture_row_to_matrix["row"].get("blood_sugar") is None
    assert capture_row_to_matrix["row"].get("body_temp") is None
    # The imputed matrix column equals the metadata default (model units),
    # identical to plain row_to_matrix — proving defaults are NOT re-converted.
    metadata_defaults = service.metadata["defaults"]
    plain, _ = tabular.row_to_matrix(
        no_sugar_temp, "maternal_risk", metadata_defaults
    )
    matrix = capture_row_to_matrix["matrix"]
    assert matrix[0, 3] == pytest.approx(metadata_defaults["blood_sugar"])
    assert matrix[0, 3] == pytest.approx(plain[0, 3])
    assert matrix[0, 4] == pytest.approx(metadata_defaults["body_temp"])


# ---------------------------------------------------------------------------
# 4. Equivalence: app units == manual conversion to model units.
# ---------------------------------------------------------------------------


def test_same_clinical_case_app_units_equals_manual_conversion(
    toy_maternal_risk, monkeypatch
):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()

    app_units = {
        "age": 35.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "blood_sugar": 96.0,
        "body_temp": 36.8,
        "heart_rate": 76.0,
        "bmi": 24.0,
        "gestational_week": 30.0,
        "hemoglobin": 11.5,
    }
    # Path A: enter the clinical case in APPLICATION units (service converts).
    result_app = service.predict(_Input(app_units))

    # Path B: manually convert to the model's NATIVE units, then disable the
    # boundary conversion so nothing is converted a second time.
    manual = dict(app_units)
    manual["blood_sugar"] = unit_conversion.blood_glucose_mg_dl_to_mmol_l(96.0)
    manual["body_temp"] = unit_conversion.temperature_celsius_to_fahrenheit(36.8)
    monkeypatch.setattr(
        "app.models.maternal_risk.unit_conversion.to_maternal_model_units",
        lambda row: dict(row),
    )
    result_manual = service.predict(_Input(manual))

    assert result_app["model_status"] == "MODEL_AVAILABLE"
    assert result_manual["model_status"] == "MODEL_AVAILABLE"
    assert result_app["probability"] == pytest.approx(result_manual["probability"])
    assert result_app["prediction"] == result_manual["prediction"]
    assert result_app["risk_level"] == result_manual["risk_level"]
    assert set(result_app["shap_values"].keys()) == set(
        tabular.feature_names("maternal_risk")
    )


# ---------------------------------------------------------------------------
# 5. Extra record fields still never enter the model.
# ---------------------------------------------------------------------------


def test_extra_fields_still_do_not_enter_model(toy_maternal_risk, monkeypatch, capture_row_to_matrix):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()
    with_extras = service.predict(_Input(VALID_MATERNAL))
    names = capture_row_to_matrix["names"]
    matrix = capture_row_to_matrix["matrix"]
    assert matrix.shape == (1, 6)
    assert set(names) == set(tabular.feature_names("maternal_risk"))
    assert not ({"bmi", "gestational_week", "hemoglobin"} & set(names))
    # Identical prediction with and without the extra record fields.
    without_extras = {k: v for k, v in VALID_MATERNAL.items()
                      if k not in ("bmi", "gestational_week", "hemoglobin")}
    plain = service.predict(_Input(without_extras))
    assert with_extras["probability"] == pytest.approx(plain["probability"])
    assert with_extras["shap_values"] == plain["shap_values"]