"""Core fine-tuning routine for NLP models (PPD DistilBERT + mood DistilBERT).

Run via the thin entry scripts:
    python scripts/train_ppd.py   [--dataset path] [--epochs 3] [--seed 42]
    python scripts/train_mood.py  [--dataset path] [--epochs 3] [--seed 42]

The input CSV must have `text` and `label` columns (labels may be strings or
0-based ints). train/val/test are stratified on the labels. The reported
metrics come from the held-out test split. The artifact (HF model dir +
tokenizer + metadata.json) is exactly what the FastAPI service loads.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from app.ml import paths
from scripts import common


_TEXT_COLUMN = "text"
_LABEL_COLUMN = "label"


def _load_text_dataset(path: Path) -> tuple[pd.DataFrame, list[str], dict[str, int]]:
    if not path.exists():
        raise common.DatasetError(
            f"Dataset not found at {path}. Place a CSV with 'text' and 'label' columns "
            "here and re-run. See docs/DATASETS.md for the exact schema."
        )
    df = pd.read_csv(path)
    missing = [c for c in (_TEXT_COLUMN, _LABEL_COLUMN) if c not in df.columns]
    if missing:
        raise common.DatasetError(
            f"Dataset {path} missing required columns: {', '.join(missing)}."
        )
    df = df.dropna(subset=[_TEXT_COLUMN])
    raw_labels = df[_LABEL_COLUMN].astype(str).str.strip()

    if pd.api.types.is_numeric_dtype(df[_LABEL_COLUMN]):
        labels = [str(int(x)) for x in df[_LABEL_COLUMN]]
    else:
        labels = list(raw_labels)

    label_to_id: dict[str, int] = {}
    for label in labels:
        if label not in label_to_id:
            label_to_id[label] = len(label_to_id)
    df = df.copy()
    df["_label_id"] = [label_to_id[label] for label in labels]
    return df, sorted(label_to_id, key=lambda k: label_to_id[k]), label_to_id


def train_nlp(category: str, note: str = "") -> None:
    parser = argparse.ArgumentParser(description=f"Fine-tune {category} DistilBERT model")
    parser.add_argument("--dataset", type=Path, default=None)
    parser.add_argument("--model-name", type=str, default="distilbert-base-uncased")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=Path, default=paths.artifacts_root())
    parser.add_argument("--fp16", action="store_true", default=False)
    args = parser.parse_args()

    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )

    dataset_path = args.dataset or paths.raw_dataset_path(category)
    df, ordered_labels, label_to_id = _load_text_dataset(dataset_path)
    num_labels = len(ordered_labels)
    print(
        f"Loaded {len(df)} rows from {dataset_path}; labels={ordered_labels} "
        f"counts={df['_label_id'].value_counts().sort_index().to_dict()}"
    )

    train, val, test = common.stratified_split(df, "_label_id", seed=args.seed)
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    def tokenize(batch: pd.DataFrame):
        return [tokenizer(text, truncation=True, max_length=args.max_length, padding="max_length") for text in batch[_TEXT_COLUMN].tolist()]

    train_encodings = tokenize(train)
    val_encodings = tokenize(val)
    test_encodings = tokenize(test)

    class TextDataset:
        def __init__(self, encodings: list[dict], labels: list[int]):
            self.encodings = encodings
            self.labels = labels

        def __len__(self) -> int:
            return len(self.labels)

        def __getitem__(self, idx: int):
            item = {k: np.asarray(v[idx]) for k, v in self.encodings[idx].items()}
            item["labels"] = self.labels[idx]
            return item

    train_ds = TextDataset(train_encodings, train["_label_id"].tolist())
    val_ds = TextDataset(val_encodings, val["_label_id"].tolist())
    test_ds = TextDataset(test_encodings, test["_label_id"].tolist())

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model_name, num_labels=num_labels
    )

    training_args = TrainingArguments(
        output_dir=str(paths.artifacts_root() / category / "training"),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        seed=args.seed,
        fp16=args.fp16,
        logging_steps=50,
    )

    def compute_metrics(eval_pred):
        from sklearn.metrics import accuracy_score, f1_score

        logits, labels = eval_pred
        preds = np.argmax(logits, axis=1)
        return {
            "accuracy": float(accuracy_score(labels, preds)),
            "macro_f1": float(f1_score(labels, preds, average="macro", zero_division=0)),
        }

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
        tokenizer=tokenizer,
    )
    trainer.train()
    val_metrics = trainer.evaluate(eval_dataset=val_ds)
    test_metrics = trainer.evaluate(eval_dataset=test_ds)
    print(f"Val metrics: {val_metrics}")
    print(f"Test metrics: {test_metrics}")

    out_dir = args.out.resolve()
    model_dir = Path(out_dir) / category / "model"
    model_dir.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(model_dir))
    tokenizer.save_pretrained(str(model_dir))

    from sklearn.metrics import classification_report

    predictions = trainer.predict(test_ds)
    pred_labels = np.argmax(predictions.predictions, axis=1)
    report = classification_report(
        test["_label_id"].tolist(), pred_labels, target_names=ordered_labels, zero_division=0
    )
    print(report)

    from datetime import datetime, timezone

    metadata = {
        "category": category,
        "version": common.today_version(),
        "model_name": args.model_name,
        "artifact_type": "hf-text-classifier",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "labels": ordered_labels,
        "label_to_id": label_to_id,
        "metrics": {
            "validation": {
                k: float(v) for k, v in val_metrics.items() if isinstance(v, (int, float))
            },
            "test": {k: float(v) for k, v in test_metrics.items() if isinstance(v, (int, float))},
            "test_classification_report": report,
        },
        "params": {
            "base_model": args.model_name,
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "max_length": args.max_length,
            "seed": args.seed,
        },
        "data_fingerprint": common.dataset_fingerprint(dataset_path),
        "note": note,
    }
    common.write_metadata(category, out_dir, metadata)
    print(f"Model saved to {model_dir}")
    print("Model is now SERVABLE: the FastAPI service will report MODEL_AVAILABLE.")