"""Train the Maternal Health Risk XGBoost model.

Usage (from apps/ml-service):
    python scripts/train_maternal_risk.py --dataset data/maternal_risk/raw/dataset.csv
"""
from scripts.tabular_training import train_tabular

if __name__ == "__main__":
    train_tabular(
        "maternal_risk",
        "risk",
        note="Binary maternal mortality risk prediction (0 = low risk, 1 = high risk).",
    )