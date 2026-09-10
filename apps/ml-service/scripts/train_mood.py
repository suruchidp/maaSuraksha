"""Fine-tune mood / sentiment DistilBERT classifier (continuous mood monitoring).

Usage (from apps/ml-service):
    python scripts/train_mood.py --dataset data/mood/raw/dataset.csv

Dataset schema: CSV with `text` (free-text mood journal entry) and `label`
(one of: negative, neutral, positive). Optionally also include `safety`
(0/1) — the serving layer always runs a deterministic crisis heuristic on
top of the model result.
"""
from scripts.nlp_training import train_nlp

if __name__ == "__main__":
    train_nlp(
        "mood",
        note="Sentiment monitoring of mood journal entries. Labels: negative, neutral, positive.",
    )