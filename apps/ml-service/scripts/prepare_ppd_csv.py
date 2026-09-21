"""Convert the Zenodo 'Multi-Class Depression Detection Dataset' (record 14233292)
into the MaaSuraksha PPD schema: text,label (postpartum | no).

Source: https://zenodo.org/records/14233292
License: CC BY 4.0
Dataset: 'Multi-Class Depression Detection Through Tweets Using Artificial Intelligence'
         Nusrat, Shahzad, Jamal — arXiv 2404.13104

We use ONLY two of the six labels:
    postpartum -> 1 (positive class)
    no         -> 0 (negative class)

The other four classes (bipolar, major depressive, psychotic, atypical) are
dropped. Reason: this module serves as a PPD signal, not a general
depression-type classifier.

Usage (from apps/ml-service):
    python scripts/prepare_ppd_csv.py --raw C:\\Users\\siri2\\Downloads\\dataset.csv --out data/ppd/raw/dataset.csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

LABEL_MAP = {
    "postpartum": "postpartum",
    "no": "no",
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", type=Path, required=True,
                    help="Raw Zenodo CSV with columns 'Tweets' and 'Labels'")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    df = pd.read_csv(args.raw)
    if "Tweets" not in df.columns or "Labels" not in df.columns:
        raise SystemExit(
            f"Raw CSV must have columns 'Tweets' and 'Labels'. "
            f"Got: {list(df.columns)}"
        )

    df = df.dropna(subset=["Tweets", "Labels"]).copy()
    df["Labels"] = df["Labels"].astype(str).str.strip().str.lower()
    df = df[df["Labels"].isin(LABEL_MAP.keys())].copy()

    # Deduplicate on text (same tweet appearing multiple times)
    before = len(df)
    df = df.drop_duplicates(subset=["Tweets"])
    print(f"Removed {before - len(df)} duplicate tweets.")

    out = df.rename(columns={"Tweets": "text", "Labels": "label"})[["text", "label"]]
    out = out.reset_index(drop=True)

    print(f"Final rows: {len(out)}")
    print(f"Label distribution: {out['label'].value_counts().to_dict()}")
    print(f"Sample text: {out['text'].iloc[0][:120]}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False, encoding="utf-8")
    print(f"Wrote {len(out)} rows to {args.out}")


if __name__ == "__main__":
    main()