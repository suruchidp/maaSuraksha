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
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.metrics import average_precision_score


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


def stratified_split(
    df: pd.DataFrame,
    target: str,
    seed: int,
    val_frac: float = 0.15,
    test_frac: float = 0.15,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
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
) -> dict[str, Any]:
    return {
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