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
    "hdl": 45.0,
    "pregnancy_count": 2.0,
    "previous_pregnancy_gestation": 1.0,
    "family_history": False,
    "unexplained_prenatal_loss": False,
    "large_child_or_birth_defect": False,
    "pcos": False,
    "systolic_bp": 118.0,
    "diastolic_bp": 78.0,
    "hemoglobin": 11.5,
    "sedentary_lifestyle": False,
}


def test_maternal_risk_feature_order():
    names = tabular.feature_names("maternal_risk")
    assert names == [
        "age", "systolic_bp", "diastolic_bp", "blood_sugar", "body_temp",
        "heart_rate",
    ]
    # BMI, gestational_week and hemoglobin are NOT features of this model.
    assert not (set(("bmi", "gestational_week", "hemoglobin")) & set(names))


def test_gdm_feature_order():
    assert tabular.feature_names("gdm") == [
        "age", "bmi", "hdl", "pregnancy_count", "previous_pregnancy_gestation",
        "family_history", "unexplained_prenatal_loss", "large_child_or_birth_defect",
        "pcos", "systolic_bp", "diastolic_bp", "hemoglobin", "sedentary_lifestyle",
    ]


def test_maternal_risk_matrix_values():
    matrix, names = tabular.row_to_matrix(VALID_MATERNAL, "maternal_risk")
    assert matrix.shape == (1, 6)
    assert names == tabular.feature_names("maternal_risk")
    assert matrix[0, 0] == 28.0
    assert matrix[0, 1] == 120.0


def test_missing_required_feature_raises():
    bad = {k: v for k, v in VALID_MATERNAL.items() if k != "blood_sugar"}
    with pytest.raises(InvalidInputError):
        tabular.row_to_matrix(bad, "maternal_risk")


def test_extra_clinical_fields_are_not_model_features():
    # Extra patient-record fields (bmi, gestational_week, hemoglobin) do not
    # become model features of the six-feature maternal risk model.
    matrix, names = tabular.row_to_matrix(VALID_MATERNAL, "maternal_risk")
    assert matrix.shape == (1, 6)
    assert "bmi" not in names
    assert "gestational_week" not in names
    assert "hemoglobin" not in names


def test_optional_feature_imputed_from_defaults():
    # hdl is optional at inference (Stage 1 inputs need not include a lipid
    # panel); NaN/absent values are imputed with the traini-split median.
    row = {k: v for k, v in VALID_GDM.items() if k != "hdl"}
    matrix, _ = tabular.row_to_matrix(row, "gdm", defaults={"hdl": 45.0})
    assert matrix[0, 2] == 45.0
    row_with_nan = dict(VALID_GDM)
    row_with_nan["hdl"] = float("nan")
    matrix2, _ = tabular.row_to_matrix(row_with_nan, "gdm", defaults={"hdl": 45.0})
    assert matrix2[0, 2] == 45.0


def test_non_numeric_required_feature_raises():
    bad = dict(VALID_MATERNAL)
    bad["age"] = "not-a-number"
    with pytest.raises(InvalidInputError):
        tabular.row_to_matrix(bad, "maternal_risk")


def test_bool_features_coerced():
    matrix, _ = tabular.row_to_matrix(VALID_GDM, "gdm")
    # pcos False -> 0 (last bool feature index = 8)
    assert matrix[0, 8] == 0.0
    row = dict(VALID_GDM)
    row["pcos"] = "TRUE"
    matrix2, _ = tabular.row_to_matrix(row, "gdm")
    assert matrix2[0, 8] == 1.0
    # Missing bool (e.g. An unknown family_history) is treated as False / 0.
    row_missing_bool = {k: v for k, v in VALID_GDM.items() if k != "family_history"}
    matrix3, _ = tabular.row_to_matrix(row_missing_bool, "gdm")
    assert matrix3[0, 5] == 0.0


def test_compute_defaults_median():
    data = np.array([[1.0], [3.0], [np.nan], [5.0]])
    defaults = tabular.compute_defaults(data, "maternal_risk")
    # median of [1,3,5] = 3
    assert defaults["age"] == pytest.approx(3.0)


def test_defaults_from_frame_train_split_median():
    import pandas as pd

    train = pd.DataFrame(
        {
            "age": [20.0, 30.0, 40.0, None],
            "bmi": [22.0, None, 26.0, 28.0],
            "hdl": [40.0, 50.0, 60.0, 70.0],
            "pregnancy_count": [1.0, 2.0, 3.0, 4.0],
            "previous_pregnancy_gestation": [0.0, 1.0, 2.0, 2.0],
            "family_history": [0.0, 1.0, 0.0, 1.0],
            "unexplained_prenatal_loss": [0.0, 0.0, 0.0, 1.0],
            "large_child_or_birth_defect": [0.0, 1.0, 0.0, 0.0],
            "pcos": [0.0, 0.0, 1.0, 0.0],
            "systolic_bp": [110.0, 120.0, 130.0, None],
            "diastolic_bp": [70.0, 80.0, 90.0, 80.0],
            "hemoglobin": [11.0, None, 12.0, 13.0],
            "sedentary_lifestyle": [1.0, 0.0, 1.0, 0.0],
        }
    )
    defaults = tabular.defaults_from_frame(train, "gdm")
    # medians of the FINITE training values: age [20,30,40]=30, bmi [22,26,28]=26
    assert defaults["age"] == pytest.approx(30.0)
    assert defaults["bmi"] == pytest.approx(26.0)
    assert defaults["systolic_bp"] == pytest.approx(120.0)
    assert defaults["hemoglobin"] == pytest.approx(12.0)