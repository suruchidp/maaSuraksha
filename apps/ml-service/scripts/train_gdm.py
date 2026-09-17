"""Train the Gestational Diabetes (GDM) EARLY RISK decision-support XGBoost model.

Stage 1 of the two-stage maternal-care workflow: this model returns a GDM
risk assessment / decision-support flag from variables available BEFORE
diagnostic glucose testing. It does NOT diagnose GDM; glucose results (OGTT)
are Stage 2 clinical measurements interpreted by a clinician.

Usage (from apps/ml-service):
    python -m scripts.train_gdm --dataset data/gdm/raw/dataset.csv

Note: the `python scripts.train_*.py` style launcher is intentionally not used
(running a script under scripts/ puts scripts/ on sys.path, so the
`from scripts...` imports fail); use the `python -m` form above.
"""
from scripts.tabular_training import train_tabular

if __name__ == "__main__":
    train_tabular(
        "gdm",
        "gdm",
        note=(
            "Early GDM risk assessment / decision support (Stage 1, not a "
            "diagnosis). 0 = Non GDM, 1 = GDM from 'Class Label(GDM /Non GDM)'. "
            "OGTT and Prediabetes are excluded from model features; a clinician "
            "interprets glucose tests in Stage 2."
        ),
    )