"""Shared helpers for reproducible training scripts.

Everything in here is about PRODUCING real artifacts from real datasets:
column validation, stratified splits, honest evaluation metrics, metadata
composition and artifact writing. No metric is hard-coded — every number in
metadata.json is computed from actual held-out predictions.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

# NOTE: scikit-learn is imported lazily inside the functions that need it so
# this module (and the pure-schema tests) can still be imported on machines
# where the Windows WDAC policy blocks native wheels like scipy/sklearn.


# ---------------------------------------------------------------------------
# Maternal Health Risk dataset (UCI) <-> MaaSuraksha contract.
#
# Official source: UCI Machine Learning Repository, Maternal Health Risk
# dataset (https://archive.ics.uci.edu/dataset/863/maternal+health+risk,
# DOI 10.24432/C5DP5D, CC BY 4.0). 1,013 records. Original columns use UCI
# names (Age, SystolicBP, ...) and a THREE-class RiskLevel target. MaaSuraksha
# maps them to six snake_case features and a BINARY target:
#   0 = low/moderate risk (low risk + mid risk)
#   1 = high risk
# The two are intentionally distinct and must not be conflated.
# ---------------------------------------------------------------------------

MATERNAL_RISK_UCI_TO_SNAKE = {
    "Age": "age",
    "SystolicBP": "systolic_bp",
    "DiastolicBP": "diastolic_bp",
    "BS": "blood_sugar",
    "BodyTemp": "body_temp",
    "HeartRate": "heart_rate",
    "RiskLevel": "risk",
}

# Original UCI RiskLevel labels -> MaaSuraksha binary target.
MATERNAL_RISK_LABEL_TO_BINARY = {
    "low risk": 0,
    "mid risk": 0,
    "high risk": 1,
}

MATERNAL_RISK_DATASET_INFO = {
    "name": "UCI Maternal Health Risk",
    "source": "UCI Machine Learning Repository",
    "url": "https://archive.ics.uci.edu/dataset/863/maternal+health+risk",
    "doi": "10.24432/C5DP5D",
    "license": "CC BY 4.0",
    "records": 1013,
    "original_features": [
        "Age",
        "SystolicBP",
        "DiastolicBP",
        "BS",
        "BodyTemp",
        "HeartRate",
    ],
    "original_target": (
        "RiskLevel (3 classes: low risk, mid risk, high risk)"
    ),
    "maasuraksha_target": "risk (binary: 0 = low/moderate risk, 1 = high risk)",
}


def _binary_risk(value: Any) -> int:
    """Map one UCI RiskLevel value (or an already-binary value) to 0/1."""
    if isinstance(value, str):
        key = value.strip().lower()
        if key in MATERNAL_RISK_LABEL_TO_BINARY:
            return MATERNAL_RISK_LABEL_TO_BINARY[key]
        raise DatasetError(
            f"Unrecognised maternal risk label {value!r}. Expected one of "
            "'low risk', 'mid risk', 'high risk' (or a precomputed binary 0/1)."
        )
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        raise DatasetError(
            f"Unparseable maternal risk target {value!r}. Expected 'low risk'/"
            "'mid risk'/'high risk' or binary 0/1."
        ) from None
    if numeric in (0.0, 1.0):
        return int(numeric)
    raise DatasetError(
        f"Maternal risk target must be binary 0/1 after transformation, got {value!r}. "
        "0 = low/moderate risk, 1 = high risk."
    )


class DatasetError(RuntimeError):
    pass


def dataset_fingerprint(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def today_version() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def load_dataset(path: Path, required_columns: list[str], target: str) -> pd.DataFrame:
    if not path.exists():
        raise DatasetError(
            f"Dataset not found at {path}. Place the dataset CSV here and re-run. "
            f"Required columns: {', '.join(required_columns + [target])}. "
            "See docs/DATASETS.md for the exact schema."
        )
    df = pd.read_csv(path)
    missing = [c for c in required_columns if c not in df.columns]
    if target not in df.columns:
        missing.append(target)
    if missing:
        raise DatasetError(
            f"Dataset {path} is missing required columns: {', '.join(sorted(missing))}. "
            "See docs/DATASETS.md for the exact schema."
        )
    if df.dropna(subset=[target]).empty:
        raise DatasetError(f"Dataset {path} has no non-null target values in '{target}'.")
    return df


def normalize_maternal_risk(
    df: pd.DataFrame, features: list[str]
) -> pd.DataFrame:
    """Map a Maternal Health Risk CSV to the MaaSuraksha training schema.

    Accepts either the raw UCI download (Age / SystolicBP / DiastolicBP / BS /
    BodyTemp / HeartRate / RiskLevel with 'low risk'/'mid risk'/'high risk'
    labels) or an already snake_case CSV. Only renames and recodes — it never
    invents, imputes or synthesises clinical values. Extra columns (e.g. bmi,
    gestational_week, hemoglobin) are dropped so they can never leak into the
    model, and NaN in any required feature is rejected.
    """
    df = df.copy()
    rename = {
        col: MATERNAL_RISK_UCI_TO_SNAKE[col]
        for col in df.columns
        if col in MATERNAL_RISK_UCI_TO_SNAKE
    }
    if rename:
        df = df.rename(columns=rename)

    required = features + ["risk"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise DatasetError(
            f"Dataset is missing required maternal_risk columns: "
            f"{', '.join(sorted(missing))}. Provide the six UCI columns "
            "(Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate, RiskLevel"
            " — mapped automatically) or the snake_case columns (age, "
            "systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate, "
            "risk). BMI, gestational_week and hemoglobin are NOT model features."
        )

    extracted = df[required].copy()
    dropped = sorted(set(df.columns) - set(required))
    if dropped:
        print(
            f"[maternal_risk] ignoring {len(dropped)} non-model column(s): "
            f"{', '.join(dropped)}"
        )

    null_counts = extracted[features].isnull().sum()
    null_columns = [col for col in features if null_counts[col] > 0]
    if null_columns:
        raise DatasetError(
            "Missing required feature value(s) in maternal_risk column(s): "
            f"{', '.join(null_columns)}. MaaSuraksha preprocessing does NOT "
            "impute missing feature values; the training dataset must be complete."
        )
    for column in features:
        try:
            extracted[column] = pd.to_numeric(extracted[column], errors="raise")
        except (ValueError, TypeError) as exc:
            raise DatasetError(
                f"Column '{column}' must be numeric; found non-numeric value(s) "
                "in the maternal_risk dataset."
            ) from exc

    extracted["risk"] = extracted["risk"].map(_binary_risk)
    if extracted["risk"].isnull().any():
        raise DatasetError(
            "Dataset has null target values in 'risk' after transformation."
        )
    return extracted


def load_maternal_risk_dataset(path: Path, features: list[str], target: str) -> pd.DataFrame:
    if not path.exists():
        raise DatasetError(
            f"Dataset not found at {path}. Place the UCI Maternal Health Risk "
            "CSV here and re-run. Required columns: "
            f"{', '.join(features + [target])} (or the original UCI columns "
            "'Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate', "
            "'RiskLevel', mapped automatically). See docs/DATASETS.md."
        )
    df = pd.read_csv(path)
    return normalize_maternal_risk(df, features)


# ---------------------------------------------------------------------------
# GDM dataset (local, sheet 'GDM-Final2022') <-> MaaSuraksha contract.
#
# Two-stage maternal-care workflow:
#   Stage 1 - community/home EARLY GDM RISK assessment / decision support,
#             using variables available BEFORE diagnostic glucose testing.
#   Stage 2 - clinical glucose testing (OGTT etc.) interpreted by a clinician.
#
# The ML model is a Stage 1 decision-support tool only; it does NOT diagnose
# GDM. The raw file (apps/ml-service/data/gdm/raw/dataset.xlsx, mirrored to
# dataset.csv) uses display names. The loader maps them to internal snake_case
# feature names WITHOUT renaming or modifying raw values. Missing feature
# values are PRESERVED (they stay NaN) so they can be filled during training
# with train-split-fitted medians; rows are never deleted and no clinical value
# is fabricated, inferred or remapped to the wrong column.
#
# Excluded from the model feature matrix (NOT dropped from the raw file):
#   - "Case Number"   -> identifier only; never a predictive feature
#   - "OGTT"          -> a diagnostic glucose test (Stage 2 clinical
#                        measurement); not an early-risk feature
#   - "Prediabetes"   -> leakage: equals the target in ~87% of rows; excluded
#                        until its meaning/timing is properly established
# ---------------------------------------------------------------------------

GDM_CSV_COLUMN_MAP = {
    "Age": "age",
    "No of Pregnancy": "pregnancy_count",
    "Gestation in previous Pregnancy": "previous_pregnancy_gestation",
    "BMI": "bmi",
    "HDL": "hdl",
    "Family History": "family_history",
    "unexplained prenetal loss": "unexplained_prenatal_loss",
    "Large Child or Birth Default": "large_child_or_birth_defect",
    "PCOS": "pcos",
    "Sys BP": "systolic_bp",
    "Dia BP": "diastolic_bp",
    "Hemoglobin": "hemoglobin",
    "Sedentary Lifestyle": "sedentary_lifestyle",
    "Class Label(GDM /Non GDM)": "gdm",
}

# Reason the loader never treats these as early-risk model features. The raw
# file keeps them untouched; they are simply absent from the model matrix.
GDM_NON_FEATURE_COLUMNS = {
    "Case Number": "identifier only; never a predictive feature",
    "OGTT": "diagnostic glucose test (Stage 2 clinical measurement); not an early-risk feature",
    "Prediabetes": "leakage concern (equals the target in ~87% of rows); excluded until its meaning/timing is established",
}

GDM_DATASET_INFO = {
    "name": "GDM early-risk dataset (local copy)",
    "source": "Single sheet 'GDM-Final2022' in apps/ml-service/data/gdm/raw/dataset.xlsx",
    "url": "local dataset supplied to the project (external origin unverified; not cited)",
    "doi": None,
    "license": "locally supplied research copy; exact license to be confirmed",
    "records": 3525,
    "original_features": sorted(GDM_CSV_COLUMN_MAP.keys()),
    "original_target": "Class Label(GDM /Non GDM) (0 = Non GDM, 1 = GDM)",
    "maasuraksha_target": "gdm (binary: 0 = Non GDM, 1 = GDM)",
}

_GDM_LABEL_TO_BINARY = {
    "non gdm": 0,
    "gdm": 1,
    "0": 0,
    "1": 1,
}


def _binary_gdm(value: Any) -> int:
    """Map one raw 'Class Label(GDM /Non GDM)' value to 0/1 (GDM = 1)."""
    if isinstance(value, str):
        key = value.strip().lower()
        if key in _GDM_LABEL_TO_BINARY:
            return _GDM_LABEL_TO_BINARY[key]
        raise DatasetError(
            f"Unrecognised GDM target label {value!r}. Expected 'Non GDM'/'GDM' "
            "or binary 0/1."
        )
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        raise DatasetError(
            f"Unparseable GDM target {value!r}. Expected 'Non GDM'/'GDM' or "
            "binary 0/1."
        ) from None
    if numeric in (0.0, 1.0):
        return int(numeric)
    raise DatasetError(
        f"GDM target must be binary 0/1 after transformation, got {value!r}. "
        "0 = Non GDM, 1 = GDM."
    )


def load_gdm_early_risk_dataset(path: Path, features: list[str], target: str) -> pd.DataFrame:
    """Load and map the GDM CSV to the MaaSuraksha EARLY-RISK training schema.

    Reads the raw file as-is (no value changes), maps display column names to
    internal snake_case feature names and keeps NaN feature values for later
    train-split imputation. 'Case Number', 'OGTT' and 'Prediabetes' are never
    used as features (the raw file is untouched). This is a Stage 1
    decision-support schema: features must be available before glucose testing.
    """
    if not path.exists():
        raise DatasetError(
            f"Dataset not found at {path}. Place the GDM-Final2022 CSV here and "
            "re-run. Expected the 17-column 'GDM-Final2022' sheet exported to "
            "CSV (see docs/GDM_DATASET_AUDIT.md and docs/GDM_MODEL_DESIGN.md)."
        )
    df = pd.read_csv(path)

    rename = {
        col: GDM_CSV_COLUMN_MAP[col]
        for col in df.columns
        if col in GDM_CSV_COLUMN_MAP
    }
    if rename:
        df = df.rename(columns=rename)

    required = features + [target]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise DatasetError(
            f"GDM dataset is missing required early-risk columns: "
            f"{', '.join(sorted(missing))}. Expected the 'GDM-Final2022' schema "
            "(mapped automatically): "
            f"{', '.join(sorted(GDM_CSV_COLUMN_MAP))}. See docs/GDM_MODEL_DESIGN.md."
        )

    excluded_present = [col for col in GDM_NON_FEATURE_COLUMNS if col in df.columns]
    ignored = sorted(set(df.columns) - set(required))
    if ignored:
        labels = ", ".join(ignored)
        if excluded_present:
            reasons = "; ".join(
                f"{col} ({GDM_NON_FEATURE_COLUMNS[col]})"
                for col in excluded_present
                if col in GDM_NON_FEATURE_COLUMNS
            )
            print(
                f"[gdm] excluding non-feature column(s) from the model matrix: "
                f"{reasons}"
            )
            print(f"[gdm] ignoring {len(ignored) - len(excluded_present)} extra column(s)")
        else:
            print(
                f"[gdm] ignoring {len(ignored)} extra column(s) not in the "
                f"early-risk schema: {labels}"
            )

    extracted = df[required].copy()

    for column in features:
        try:
            extracted[column] = pd.to_numeric(extracted[column], errors="raise")
        except (ValueError, TypeError) as exc:
            raise DatasetError(
                f"Column '{column}' must be numeric; found non-numeric value(s) "
                "in the GDM dataset."
            ) from exc

    extracted[target] = extracted[target].map(_binary_gdm)
    if extracted[target].isnull().any():
        raise DatasetError(
            "Dataset has null target values in the GDM target after transformation."
        )
    if extracted[target].nunique() < 2:
        raise DatasetError(
            "Dataset must contain BOTH target classes (0 = Non GDM, 1 = GDM) "
            "after transformation."
        )

    null_features = [col for col in features if extracted[col].isnull().any()]
    if null_features:
        print(
            f"[gdm] missing feature value(s) preserved for train-split median "
            f"imputation in: {', '.join(null_features)}"
        )
    print(f"[gdm] loaded {len(extracted)} rows, {len(features)} early-risk features, "
          f"target '{target}' (classes: "
          f"{int((extracted[target] == 0).sum())} non-GDM / "
          f"{int((extracted[target] == 1).sum())} GDM).")
    return extracted


def stratified_split(
    df: pd.DataFrame,
    target: str,
    seed: int,
    val_frac: float = 0.15,
    test_frac: float = 0.15,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    from sklearn.model_selection import StratifiedShuffleSplit

    idx = np.arange(len(df))
    sss = StratifiedShuffleSplit(
        n_splits=1, test_size=test_frac, random_state=seed
    )
    train_val_idx, test_idx = next(sss.split(idx, df[target]))
    train_val = df.iloc[train_val_idx]
    test = df.iloc[test_idx]
    inner = StratifiedShuffleSplit(
        n_splits=1, test_size=val_frac / (1 - test_frac), random_state=seed + 1
    )
    train_idx, val_idx = next(inner.split(np.arange(len(train_val)), train_val[target]))
    return train_val.iloc[train_idx], train_val.iloc[val_idx], test


def classification_scores(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> dict[str, float]:
    from sklearn.metrics import (
        accuracy_score,
        average_precision_score,
        f1_score,
        precision_score,
        recall_score,
        roc_auc_score,
    )

    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "pr_auc": float(average_precision_score(y_true, y_prob)),
    }


def best_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Threshold on the VALIDATION set that maximises F1 (computed, not guessed)."""
    from sklearn.metrics import f1_score

    bins = np.linspace(0.05, 0.95, 91)
    best_t, best_f1 = 0.5, -1.0
    for t in bins:
        preds = (y_prob >= t).astype(int)
        f1 = f1_score(y_true, preds, zero_division=0)
        if f1 > best_f1:
            best_f1, best_t = f1, float(t)
    return best_t


def print_metrics(split_name: str, scores: dict[str, float]) -> None:
    parts = "  ".join(f"{k}={v:.4f}" for k, v in sorted(scores.items()))
    print(f"[{split_name}] {parts}")


def write_metadata(category: str, out_dir: Path, metadata: dict[str, Any]) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / category / "metadata.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Metadata written to {path}")
    return path


def compose_tabular_metadata(
    category: str,
    version: str,
    model_name: str,
    metrics: dict[str, dict[str, float]],
    features: list[str],
    defaults: dict[str, float],
    target: str,
    thresholds: dict[str, float],
    params: dict[str, Any],
    data_fingerprint: str,
    note: str = "",
    dataset: dict[str, Any] | None = None,
    target_definition: str = "",
) -> dict[str, Any]:
    metadata = {
        "category": category,
        "version": version,
        "model_name": model_name,
        "artifact_type": "xgboost-classifier",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "target": target,
        "features": features,
        "defaults": {k: round(float(v), 6) for k, v in defaults.items()},
        "metrics": metrics,
        "thresholds": {k: round(float(v), 6) for k, v in thresholds.items()},
        "params": params,
        "data_fingerprint": data_fingerprint,
        "note": note,
    }
    if dataset:
        metadata["dataset"] = dataset
    if target_definition:
        metadata["target_definition"] = target_definition
    return metadata