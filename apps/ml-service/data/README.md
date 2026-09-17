# Datasets

This directory is the **input location for training data**. It is NOT bundled
with the repository and is NOT required for the service to run.

The FastAPI inference service never reads these files. It only reads trained
artifacts from `../artifacts`. Models stay `MODEL_UNAVAILABLE` until someone
obtains a suitable, licensed dataset, places it here, and runs the training
scripts.

See `docs/DATASETS.md` for the full dataset plan (required datasets, target
variables, features, licensing and limitations).

Layout:

- `maternal_risk/raw/dataset.csv` — binary `risk` column (0 = low/moderate, 1 = high) + 6 features (age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate). UCI column names accepted and mapped automatically.
- `gdm/raw/dataset.csv` — binary `gdm` column (+ 8 features)
- `ppd/raw/dataset.csv` — `text` + `label` (none|mild|moderate|severe)
- `mood/raw/dataset.csv` — `text` + `label` (negative|neutral|positive)

Each subfolder has a README with the exact expected schema.