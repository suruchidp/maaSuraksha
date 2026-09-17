"""Train the Maternal Health Risk XGBoost model.

Dataset: UCI Maternal Health Risk (https://archive.ics.uci.edu/dataset/863/maternal+health+risk,
DOI 10.24432/C5DP5D, CC BY 4.0). Features are exactly the six measured UCI
predictors mapped to snake_case; BMI, gestational week and hemoglobin are NOT
model features. Target is the binary transformation of the original three-class
RiskLevel: low risk + mid risk -> 0, high risk -> 1.

Usage (from apps/ml-service):
    python scripts/train_maternal_risk.py --dataset data/maternal_risk/raw/dataset.csv

The raw UCI download (Age/SystolicBP/DiastolicBP/BS/BodyTemp/HeartRate/RiskLevel)
is accepted and mapped automatically.
"""
from scripts.tabular_training import train_tabular

if __name__ == "__main__":
    train_tabular(
        "maternal_risk",
        "risk",
        note=(
            "Binary maternal risk (0 = low/moderate risk, 1 = high risk). "
            "Transformed from UCI RiskLevel (low risk + mid risk -> 0, "
            "high risk -> 1); NOT the original three-class UCI target."
        ),
    )