"""Fine-tune PPD screening DistilBERT classifier.

Usage (from apps/ml-service):
    python scripts/train_ppd.py --dataset data/ppd/raw/dataset.csv

Dataset schema: CSV with `text` (screening/narrative text) and `label`
(one of: none, mild, moderate, severe).
"""
from scripts.nlp_training import train_nlp

if __name__ == "__main__":
    train_nlp(
        "ppd",
        note="PPD severity screening from free text. Labels: none, mild, moderate, severe.",
    )