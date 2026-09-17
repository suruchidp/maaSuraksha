"""Maternal Risk dataset / pipeline contract tests.

Covers the six-feature MaaSuraksha model contract for the UCI Maternal Health
Risk dataset: schema, UCI column mapping, binary target transformation, strict
validation, metadata provenance and the laptop-safe thread bound. No model is
trained here.
"""

import os

import pandas as pd
import pytest

from app.core.config import Settings
from app.ml import paths, tabular
from scripts import common

SIX_FEATURES = [
    "age",
    "systolic_bp",
    "diastolic_bp",
    "blood_sugar",
    "body_temp",
    "heart_rate",
]

UCI_ROWS = [
    {"Age": 25, "SystolicBP": 120, "DiastolicBP": 80, "BS": 90,
     "BodyTemp": 36.5, "HeartRate": 72, "RiskLevel": "low risk"},
    {"Age": 35, "SystolicBP": 140, "DiastolicBP": 95, "BS": 180,
     "BodyTemp": 37.2, "HeartRate": 88, "RiskLevel": "mid risk"},
    {"Age": 41, "SystolicBP": 175, "DiastolicBP": 110, "BS": 300,
     "BodyTemp": 38.6, "HeartRate": 99, "RiskLevel": "high risk"},
]


def _uci_frame() -> pd.DataFrame:
    return pd.DataFrame(UCI_ROWS)


class _Input:
    def __init__(self, data):
        self.data = data

    def model_dump(self):
        return dict(self.data)


def test_six_feature_schema():
    names = tabular.feature_names("maternal_risk")
    assert names == SIX_FEATURES
    assert len(names) == 6
    assert not ({"bmi", "gestational_week", "hemoglobin"} & set(names))


def test_uci_column_mapping_to_snake_case():
    assert common.MATERNAL_RISK_UCI_TO_SNAKE == {
        "Age": "age",
        "SystolicBP": "systolic_bp",
        "DiastolicBP": "diastolic_bp",
        "BS": "blood_sugar",
        "BodyTemp": "body_temp",
        "HeartRate": "heart_rate",
        "RiskLevel": "risk",
    }


@pytest.mark.parametrize(
    "label,expected",
    [
        ("low risk", 0),
        ("mid risk", 0),
        ("high risk", 1),
        ("LOW RISK", 0),
        (" Mid Risk ", 0),
        ("HIGH RISK", 1),
    ],
)
def test_target_transformation_labels(label, expected):
    out = common.normalize_maternal_risk(
        pd.DataFrame({"Age": [25], "SystolicBP": [120], "DiastolicBP": [80],
                      "BS": [90], "BodyTemp": [36.5], "HeartRate": [72],
                      "RiskLevel": [label]}),
        SIX_FEATURES,
    )
    assert list(out["risk"]) == [expected]


def test_target_transformation_binary_passthrough():
    df = pd.DataFrame({name: [1.0] for name in SIX_FEATURES})
    df["risk"] = [1]
    out = common.normalize_maternal_risk(df, SIX_FEATURES)
    assert list(out["risk"]) == [1]


def test_target_transformation_unknown_label_fails():
    df = _uci_frame()
    df.iloc[0, df.columns.get_loc("RiskLevel")] = "very high"
    with pytest.raises(common.DatasetError, match="Unrecognised maternal risk label"):
        common.normalize_maternal_risk(df, SIX_FEATURES)


def test_invalid_missing_columns_fail_clearly(tmp_path):
    df = _uci_frame().drop(columns=["BodyTemp"])
    csv = tmp_path / "bad.csv"
    df.to_csv(csv, index=False)
    with pytest.raises(common.DatasetError, match="missing required maternal_risk columns"):
        common.load_maternal_risk_dataset(csv, SIX_FEATURES, "risk")


def test_missing_required_values_rejected_not_imputed(tmp_path):
    df = _uci_frame()
    df.loc[0, "BS"] = float("nan")
    csv = tmp_path / "nan.csv"
    df.to_csv(csv, index=False)
    with pytest.raises(common.DatasetError, match="Missing required feature value"):
        common.load_maternal_risk_dataset(csv, SIX_FEATURES, "risk")


def test_non_numeric_feature_rejected(tmp_path):
    rows = [dict(row) for row in UCI_ROWS]
    rows[0]["HeartRate"] = "high"
    df = pd.DataFrame(rows)
    csv = tmp_path / "nonnum.csv"
    df.to_csv(csv, index=False)
    with pytest.raises(common.DatasetError, match="must be numeric"):
        common.load_maternal_risk_dataset(csv, SIX_FEATURES, "risk")


def test_extra_clinical_columns_do_not_become_features(tmp_path):
    df = _uci_frame()
    df["bmi"] = [22.0, 27.0, 31.0]
    df["gestational_week"] = [18, 27, 34]
    df["hemoglobin"] = [12.1, 11.2, 10.3]
    csv = tmp_path / "extra.csv"
    df.to_csv(csv, index=False)
    out = common.load_maternal_risk_dataset(csv, SIX_FEATURES, "risk")
    assert list(out.columns) == SIX_FEATURES + ["risk"]
    assert "bmi" not in out.columns
    assert "gestational_week" not in out.columns
    assert "hemoglobin" not in out.columns


def test_load_uci_dataset_end_to_end(tmp_path):
    csv = tmp_path / "dataset.csv"
    _uci_frame().to_csv(csv, index=False)
    out = common.load_maternal_risk_dataset(csv, SIX_FEATURES, "risk")
    assert len(out) == 3
    assert list(out["risk"]) == [0, 0, 1]
    assert list(out.columns) == SIX_FEATURES + ["risk"]


def test_metadata_contains_exactly_six_features():
    metadata = common.compose_tabular_metadata(
        category="maternal_risk",
        version="v1",
        model_name="XGBClassifier",
        metrics={"test": {"f1": 0.8}},
        features=SIX_FEATURES,
        defaults={f: 0.0 for f in SIX_FEATURES},
        target="risk",
        thresholds={"high_risk": 0.5},
        params={},
        data_fingerprint="fpr",
        dataset=common.MATERNAL_RISK_DATASET_INFO,
        target_definition="0 = low/moderate risk, 1 = high risk",
    )
    assert metadata["features"] == SIX_FEATURES
    assert "bmi" not in metadata["features"]
    assert metadata["target"] == "risk"
    assert "0 = low/moderate risk" in metadata["target_definition"]
    assert metadata["dataset"]["doi"] == "10.24432/C5DP5D"
    assert metadata["dataset"]["source"] == "UCI Machine Learning Repository"
    assert metadata["dataset"]["license"] == "CC BY 4.0"


@pytest.mark.parametrize("env_value", ["0", "1", "2", "99"])
def test_cpu_thread_config_bounded(monkeypatch, env_value):
    monkeypatch.setenv("MAASURAKSHA_ML_THREADS", env_value)
    threads = Settings().MAASURAKSHA_ML_THREADS
    assert threads >= 1
    assert threads <= max(1, os.cpu_count() or 1)


def test_cpu_thread_default_is_two(monkeypatch):
    monkeypatch.delenv("MAASURAKSHA_ML_THREADS", raising=False)
    assert Settings().MAASURAKSHA_ML_THREADS == min(2, max(1, os.cpu_count() or 1))


def test_no_synthetic_values_generated():
    out = common.normalize_maternal_risk(_uci_frame(), SIX_FEATURES)
    assert len(out) == len(UCI_ROWS)
    assert float(out.loc[0, "age"]) == 25.0
    assert float(out.loc[0, "systolic_bp"]) == 120.0
    assert float(out.loc[0, "blood_sugar"]) == 90.0
    assert float(out.loc[2, "body_temp"]) == 38.6
    assert float(out.loc[2, "heart_rate"]) == 99.0


def test_model_unavailable_behavior_intact(tmp_path, monkeypatch):
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    from app.models.maternal_risk import MaternalRiskService

    result = MaternalRiskService().predict(
        _Input({
            "age": 28.0, "systolic_bp": 120.0, "diastolic_bp": 80.0,
            "blood_sugar": 90.0, "body_temp": 36.5, "heart_rate": 72.0,
        })
    )
    assert result["model_status"] == "MODEL_UNAVAILABLE"
    assert result["prediction"] is None
    assert result["probability"] is None
    assert result["shap_values"] is None