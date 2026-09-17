"""GDM early-risk schema & loader tests (data/gdm -> MaaSuraksha contract).

Covered guarantees:
- The loader maps the raw 'GDM-Final2022' display names to snake_case features
  WITHOUT altering raw values (no fabricated/imputed/fabricated columns).
- Missing feature values are PRESERVED (NaN) in the returned frame so that
  imputation uses train-split-fitted medians — never invented at load time.
- Case Number, OGTT and Prediabetes never appear in the model feature set.
- The GDM target is binary 0/1 with both classes present.
"""

import pandas as pd
import pytest

from app.ml import tabular
from scripts import common
from scripts.common import DatasetError

RAW_COLUMNS = [
    "Case Number",
    "No of Pregnancy",
    "Age",
    "Gestation in previous Pregnancy",
    "BMI",
    "HDL",
    "Sys BP",
    "Dia BP",
    "OGTT",
    "Hemoglobin",
    "PCOS",
    "Sedentary Lifestyle",
    "Prediabetes",
    "Family History",
    "unexplained prenetal loss",
    "Large Child or Birth Default",
    "Class Label(GDM /Non GDM)",
]


def _gdm_csv(tmp_path, rows):
    path = tmp_path / "dataset.csv"
    pd.DataFrame(rows, columns=RAW_COLUMNS).to_csv(path, index=False)
    return path


def test_gdm_feature_set_is_early_risk_only():
    names = tabular.feature_names("gdm")
    assert names == [
        "age", "bmi", "hdl", "pregnancy_count", "previous_pregnancy_gestation",
        "family_history", "unexplained_prenatal_loss", "large_child_or_birth_defect",
        "pcos", "systolic_bp", "diastolic_bp", "hemoglobin", "sedentary_lifestyle",
    ]
    # Stage 2 variables are CLINICAL measurements, never model features.
    assert not ({"fasting_glucose", "postprandial_glucose", "hba1c",
                 "gestational_week", "previous_gdm", "ogtt", "prediabetes"
                 } & set(names))


def test_gdm_loader_keeps_rows_and_nan(tmp_path):
    rows = [
        row
        for row in [
            [1, 1, 25, 0, 24.0, 42.0, 110, 70, 90.0, 11.2, 0, 0, 0, 0, 0, 0, 0],
            [2, 2, 30, 1, None, None, 118, 78, 95.0, 11.5, 0, 1, 1, 1, 0, 1, 1],
            [3, 3, 34, 2, 28.5, 50.0, None, None, 100.0, None, 1, 0, 0, 0, 1, 0, 0],
        ]
    ]
    path = _gdm_csv(tmp_path, rows)
    df = common.load_gdm_early_risk_dataset(
        path, tabular.feature_names("gdm"), "gdm"
    )
    assert len(df) == 3  # rows preserved, never deleted
    assert set(df.columns) == set(tabular.feature_names("gdm") + ["gdm"])
    # Display names -> snake_case mapping is applied, raw values untouched.
    assert df["age"].tolist() == [25, 30, 34]
    assert df["pregnancy_count"].tolist() == [1, 2, 3]
    assert df["family_history"].tolist() == [0, 1, 0]
    # Missing values are PRESERVED (not invented) for train-split imputation.
    assert df["bmi"].isnull().sum() == 1
    assert df["systolic_bp"].isnull().sum() == 1
    assert df["hemoglobin"].isnull().sum() == 1
    assert df["gdm"].tolist() == [0, 1, 0]


def test_gdm_loader_excludes_case_ogtt_prediabetes(tmp_path):
    rows = [
        [1, 1, 25, 0, 24.0, 42.0, 110, 70, 90.0, 11.2, 0, 0, 0, 0, 0, 0, 0],
        [2, 2, 30, 1, 26.0, 50.0, 118, 78, 95.0, 12.0, 1, 1, 1, 1, 0, 1, 1],
    ]
    path = _gdm_csv(tmp_path, rows)
    df = common.load_gdm_early_risk_dataset(
        path, tabular.feature_names("gdm"), "gdm"
    )
    assert "Case Number" not in df.columns
    assert "OGTT" not in df.columns
    assert "Prediabetes" not in df.columns


def test_gdm_loader_rejects_numeric_target_state(tmp_path):
    rows = [[1, 1, 25, 0, 24.0, 42.0, 110, 70, 90.0, 11.2, 0, 0, 0, 0, 0, 0, 2]]
    path = _gdm_csv(tmp_path, rows)
    with pytest.raises(DatasetError, match="binary 0/1"):
        common.load_gdm_early_risk_dataset(
            path, tabular.feature_names("gdm"), "gdm"
        )


def test_gdm_loader_rejects_single_class(tmp_path):
    rows = [[1, 1, 25, 0, 24.0, 42.0, 110, 70, 90.0, 11.2, 0, 0, 0, 0, 0, 0, 0]] * 2
    path = _gdm_csv(tmp_path, rows)
    with pytest.raises(DatasetError, match="BOTH target classes"):
        common.load_gdm_early_risk_dataset(
            path, tabular.feature_names("gdm"), "gdm"
        )


def test_gdm_loader_missing_required_column_raises(tmp_path):
    rows = [[1, 1, 25, 0, 24.0, 42.0, 110, 70, 90.0, 11.2, 0, 0, 0, 0, 0, 0, 0]]
    path = tmp_path / "dataset.csv"
    table = pd.DataFrame(rows, columns=RAW_COLUMNS).drop(columns=["BMI"])
    table.to_csv(path, index=False)
    with pytest.raises(DatasetError, match="missing required early-risk columns"):
        common.load_gdm_early_risk_dataset(
            path, tabular.feature_names("gdm"), "gdm"
        )


def test_gdm_dataset_info_uses_local_provenance():
    info = common.GDM_DATASET_INFO
    assert info["records"] == 3525
    assert "GDM-Final2022" in info["source"]
    assert info["doi"] is None
    assert "Class Label(GDM /Non GDM)" in info["original_target"]
    # Excluded columns carry explicit reasons in the contract.
    assert "Case Number" in common.GDM_NON_FEATURE_COLUMNS
    assert "OGTT" in common.GDM_NON_FEATURE_COLUMNS
    assert "Prediabetes" in common.GDM_NON_FEATURE_COLUMNS