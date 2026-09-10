"""Train the Gestational Diabetes (GDM) detection XGBoost model.

Usage (from apps/ml-service):
    python scripts/train_gdm.py --dataset data/gdm/raw/dataset.csv
"""
from scripts.tabular_training import train_tabular

if __name__ == "__main__":
    train_tabular(
        "gdm",
        "gdm",
        note="Binary GDM detection (0 = no GDM, 1 = GDM). Clinical validation required.",
    )