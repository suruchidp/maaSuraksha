import numpy as np
import pytest

from app.ml import tabular
from app.ml.exceptions import InvalidInputError

VALID_MATERNAL = {
    "age": 28.0,
    "systolic_bp": 120.0,
    "diastolic_bp": 80.0,
    "blood_sugar": 90.0,
    "body_temp": 36.5,
    "heart_rate": 72.0,
    "bmi": 23.5,
    "gestational_week": 20.0,
    "hemoglobin": 11.5,
}

VALID_GDM = {
    "age": 30.0,
    "bmi": 24.5,
    "fasting_glucose": 90.0,
    "postprandial_glucose": 140.0,
    "hba1c": 5.2,
    "gestational_week": 24.0,
    "family_history_diabetes": False,
    "previous_gdm": False,
}


def test_maternal_risk_feature_order():
    names = tabular.feature_names("maternal_risk")
    assert names == [
        "age", "systolic_bp", "diastolic_bp", "blood_sugar", "body_temp",
        "heart_rate", "bmi", "gestational_week", "hemoglobin",
    ]


def test_gdm_feature_order():
    assert tabular.feature_names("gdm") == [
        "age", "bmi", "fasting_glucose", "postprandial_glucose", "hba1c",
        "gestational_week", "family_history_diabetes", "previous_gdm",
    ]


def test_maternal_risk_matrix_values():
    matrix, names = tabular.row_to_matrix(VALID_MATERNAL, "maternal_risk")
    assert matrix.shape == (1, 9)
    assert names == tabular.feature_names("maternal_risk")
    assert matrix[0, 0] == 28.0
    assert matrix[0, 1] == 120.0


def test_missing_required_feature_raises():
    bad = {k: v for k, v in VALID_MATERNAL.items() if k != "bmi"}
    with pytest.raises(InvalidInputError):
        tabular.row_to_matrix(bad, "maternal_risk")


def test_optional_feature_imputed_from_defaults():
    row = {k: v for k, v in VALID_MATERNAL.items() if k != "hemoglobin"}
    matrix, _ = tabular.row_to_matrix(
        row, "maternal_risk", defaults={"hemoglobin": 11.0}
    )
    assert matrix[0, -1] == 11.0


def test_non_numeric_required_feature_raises():
    bad = dict(VALID_MATERNAL)
    bad["age"] = "not-a-number"
    with pytest.raises(InvalidInputError):
        tabular.row_to_matrix(bad, "maternal_risk")


def test_bool_features_coerced():
    matrix, _ = tabular.row_to_matrix(VALID_GDM, "gdm")
    assert matrix[0, -1] == 0.0  # previous_gdm False
    row = dict(VALID_GDM)
    row["previous_gdm"] = "TRUE"
    matrix2, _ = tabular.row_to_matrix(row, "gdm")
    assert matrix2[0, -1] == 1.0


def test_compute_defaults_median():
    data = np.array([[1.0], [3.0], [np.nan], [5.0]])
    defaults = tabular.compute_defaults(data, "maternal_risk")
    # median of [1,3,5] = 3
    assert defaults["age"] == pytest.approx(3.0)