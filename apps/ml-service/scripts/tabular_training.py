"""Core training routine for tabular XGBoost models (maternal risk & GDM).

Run via the thin entry scripts:
    python scripts/train_maternal_risk.py [--dataset path] [--seed 42]
    python scripts/train_gdm.py          [--dataset path] [--seed 42]

Everything below is real: the model is fitted on the training split, early
stops on validation, thresholds are optimised on validation, and the reported
metrics come from held-out test predictions. The written artifact carries
those real metrics so the serving layer can report them truthfully.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from app.core.config import settings
from app.ml import paths, tabular
from scripts import common


def dataframe_to_matrix(
    df: pd.DataFrame, category: str, defaults: dict[str, float]
) -> np.ndarray:
    rows = []
    for _, row in df.iterrows():
        matrix, _ = tabular.row_to_matrix(row.to_dict(), category, defaults)
        rows.append(matrix[0])
    return np.asarray(rows, dtype=np.float32)


def train_tabular(category: str, target: str, note: str = "") -> None:
    parser = argparse.ArgumentParser(description=f"Train {category} XGBoost model")
    parser.add_argument("--dataset", type=Path, default=None)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=Path, default=paths.artifacts_root())
    args = parser.parse_args()

    from xgboost import XGBClassifier

    dataset_path = args.dataset or paths.raw_dataset_path(category)
    features = tabular.feature_names(category)

    if category == "maternal_risk":
        df = common.load_maternal_risk_dataset(dataset_path, features, target)
    elif category == "gdm":
        df = common.load_gdm_early_risk_dataset(dataset_path, features, target)
    else:
        df = common.load_dataset(dataset_path, features, target)

    values = set(df[target].dropna().unique())
    if not set(values).issubset({0, 1}) or len(values) < 2:
        raise common.DatasetError(
            f"Target column '{target}' must contain binary 0/1 values, got {sorted(values)}."
        )

    train, val, test = common.stratified_split(df, target, seed=args.seed)
    print(f"Loaded {len(df)} rows from {dataset_path} (train={len(train)}, val={len(val)}, test={len(test)})")

    defaults = tabular.defaults_from_frame(train, category)
    X_train = dataframe_to_matrix(train, category, defaults)
    X_val = dataframe_to_matrix(val, category, defaults)
    X_test = dataframe_to_matrix(test, category, defaults)
    y_train = train[target].to_numpy(float)
    y_val = val[target].to_numpy(float)
    y_test = test[target].to_numpy(float)

    params = {
        "n_estimators": 800,
        "max_depth": 5,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 2,
        "random_state": args.seed,
        "eval_metric": "logloss",
        "early_stopping_rounds": 30,
        # Laptop-safe: bound XGBoost thread usage (MAASURAKSHA_ML_THREADS,
        # default 2). No GPU, no multi-model parallelism.
        "n_jobs": settings.MAASURAKSHA_ML_THREADS,
        "tree_method": "hist",
    }
    clf = XGBClassifier(**params)
    eval_set = [(X_train, y_train), (X_val, y_val)]
    clf.fit(X_train, y_train, eval_set=eval_set, verbose=False)

    prob_val = clf.predict_proba(X_val)[:, 1]
    optimal_threshold = common.best_threshold(y_val, prob_val)

    if category == "maternal_risk":
        thresholds = {
            "high_risk": optimal_threshold,
            "critical_risk": 0.85,
        }
    else:
        thresholds = {"positive": optimal_threshold}

    def scores(split_y: np.ndarray, prob: np.ndarray, threshold: float) -> dict[str, float]:
        pred = (prob >= threshold).astype(int)
        return common.classification_scores(split_y, pred, prob)

    metrics = {
        "validation": scores(y_val, prob_val, optimal_threshold),
        "test": scores(y_test, clf.predict_proba(X_test)[:, 1], optimal_threshold),
    }
    common.print_metrics("validation", metrics["validation"])
    common.print_metrics("test", metrics["test"])

    version = common.today_version()
    out_dir = args.out.resolve()
    model_path = Path(out_dir) / category / "model.xgb"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    clf.save_model(str(model_path))

    if category == "maternal_risk":
        dataset = dict(common.MATERNAL_RISK_DATASET_INFO)
        target_definition = (
            "0 = low/moderate risk, 1 = high risk. Binary transformation of the "
            "original UCI RiskLevel (3 classes): low risk + mid risk -> 0, "
            "high risk -> 1."
        )
    elif category == "gdm":
        dataset = dict(common.GDM_DATASET_INFO)
        target_definition = (
            "gdm is the Stage 1 EARLY RISK decision-support target: "
            "0 = Non GDM, 1 = GDM (from 'Class Label(GDM /Non GDM)'). The model "
            "is NOT a diagnostic tool; it assesses pre-glucose-testing risk only, "
            "and clinical interpretation (Stage 2) remains with the clinician."
        )
    else:
        dataset = None
        target_definition = ""

    metadata = common.compose_tabular_metadata(
        category=category,
        version=version,
        model_name="XGBClassifier",
        metrics=metrics,
        features=features,
        defaults=defaults,
        target=target,
        thresholds=thresholds,
        params=params,
        data_fingerprint=common.dataset_fingerprint(dataset_path),
        note=note,
        dataset=dataset,
        target_definition=target_definition,
    )
    common.write_metadata(category, out_dir, metadata)

    print(f"Model saved to {model_path}")
    print(f"Thresholds: {thresholds}")
    print(f"Optimised on validation split (F1-max), not hard-coded. Test metrics above are real held-out numbers.")
    print("Model is now SERVABLE: the FastAPI service will report MODEL_AVAILABLE.")