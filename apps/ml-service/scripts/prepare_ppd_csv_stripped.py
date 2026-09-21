"""Convert the Zenodo Multi-Class Depression Detection Dataset into the
MaaSuraksha PPD schema, with lexicon keywords stripped from the text.

Purpose: the original dataset labels were assigned via lexicon keyword
matching. Training on the raw text risks the model simply learning the same
keywords. This stripped variant tests that hypothesis: if the model still
performs well after the keywords are removed, the signal is real; if it
collapses, the original result was largely keyword leakage.

Source: https://zenodo.org/records/14233292
License: CC BY 4.0

Usage (from apps/ml-service):
    python scripts/prepare_ppd_csv_stripped.py \
        --raw C:\\Users\\siri2\\Downloads\\dataset.csv \
        --out data/ppd/raw/dataset_stripped.csv
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd

LABEL_MAP = {"postpartum": "postpartum", "no": "no"}

# Keywords the lexicon likely used. Removing these forces the model to rely
# on surrounding context rather than the exact matching terms.
# Kept as whole-word matches, case-insensitive.
STRIP_TERMS = [
    "postpartum", "post-partum", "post partum",
    "baby", "babies", "newborn", "infant",
    "pregnancy", "pregnant",
    "depression", "depressed", "depressive",
    "mental", "psychiatric",
    "diagnosed", "diagnosis",
    "suicidal", "suicide",
    "anxiety", "anxious",
    "bipolar", "psychotic", "atypical", "major",
    "ppd",
]


def _strip_terms(text: str) -> str:
    out = text
    for term in STRIP_TERMS:
        pattern = re.compile(rf"\b{re.escape(term)}\b", flags=re.IGNORECASE)
        out = pattern.sub(" ", out)
    out = re.sub(r"\s+", " ", out).strip()
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    df = pd.read_csv(args.raw)
    if "Tweets" not in df.columns or "Labels" not in df.columns:
        raise SystemExit(
            f"Raw CSV must have columns 'Tweets' and 'Labels'. Got: {list(df.columns)}"
        )

    df = df.dropna(subset=["Tweets", "Labels"]).copy()
    df["Labels"] = df["Labels"].astype(str).str.strip().str.lower()
    df = df[df["Labels"].isin(LABEL_MAP.keys())].copy()
    df = df.drop_duplicates(subset=["Tweets"])

    df["text"] = df["Tweets"].map(_strip_terms)
    df = df[df["text"].str.len() >= 15]  # drop rows that became too short to be useful

    out = df.rename(columns={"Labels": "label"})[["text", "label"]].reset_index(drop=True)
    print(f"Final rows: {len(out)}")
    print(f"Label distribution: {out['label'].value_counts().to_dict()}")
    print(f"Sample stripped text: {out['text'].iloc[0][:120]}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False, encoding="utf-8")
    print(f"Wrote {len(out)} rows to {args.out}")


if __name__ == "__main__":
    main()