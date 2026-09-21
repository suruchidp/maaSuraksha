"""Convert the Indic sentiment dataset (HuggingFace: dhruv0808/indic_sentiment_analyzer)
into the MaaSuraksha mood schema: text,label (negative|neutral|positive).

Filtering:
  - Keep only rows whose text is in one of: English (Latin), Hindi (Devanagari),
    Kannada (Kannada script).
  - Drop rows whose label is None or missing.
  - Lowercase the label to match the training schema.

This dataset is general Indic sentiment, NOT maternal-specific. The domain-shift
limitation is documented in docs/DATASET_MANIFEST.md.

Usage (from apps/ml-service):
    python scripts/prepare_mood_csv.py --out data/mood/raw/dataset.csv
"""

from __future__ import annotations

import argparse
import unicodedata
from pathlib import Path

import pandas as pd


def _script_of(text: str) -> str:
    """Return the dominant script family of a piece of text."""
    if not isinstance(text, str) or not text.strip():
        return "empty"
    counts: dict[str, int] = {}
    for ch in text:
        if not ch.isalpha():
            continue
        try:
            name = unicodedata.name(ch)
        except ValueError:
            continue
        if "DEVANAGARI" in name:
            counts["hi"] = counts.get("hi", 0) + 1
        elif "KANNADA" in name:
            counts["kn"] = counts.get("kn", 0) + 1
        elif "LATIN" in name:
            counts["en"] = counts.get("en", 0) + 1
    if not counts:
        return "other"
    return max(counts, key=counts.get)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    print("Loading dhruv0808/indic_sentiment_analyzer from HuggingFace ...")
    from datasets import load_dataset

    ds = load_dataset("dhruv0808/indic_sentiment_analyzer")["train"]
    df = ds.to_pandas()
    print(f"Loaded {len(df)} raw rows.")

    # Normalize labels: keep only Positive / Negative / Neutral.
    label_map = {"positive": "positive", "negative": "negative", "neutral": "neutral"}
    df = df.dropna(subset=["Sentence", "Label"])
    df["label"] = df["Label"].astype(str).str.strip().str.lower().map(label_map)
    df = df.dropna(subset=["label"])
    print(f"{len(df)} rows after label normalization.")

    # Detect script per row and keep en / hi / kn only.
    df["lang"] = df["Sentence"].map(_script_of)
    df = df[df["lang"].isin(["en", "hi", "kn"])]
    print(f"{len(df)} rows after en/hi/kn script filter.")
    print("Language breakdown:")
    print(df["lang"].value_counts().to_dict())

    out = df[["Sentence", "label"]].rename(columns={"Sentence": "text"}).copy()
    out = out.drop_duplicates(subset=["text"]).reset_index(drop=True)
    print(f"{len(out)} rows after de-duplication.")
    print("Label distribution:")
    print(out["label"].value_counts().to_dict())

    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False, encoding="utf-8")
    print(f"Wrote {len(out)} rows to {args.out}")


if __name__ == "__main__":
    main()