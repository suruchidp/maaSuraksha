# Model artifacts

This directory holds **trained model artifacts** produced by the training
scripts. It is git-ignored and not bundled.

Layout:

- `maternal_risk/model.xgb` + `metadata.json`
- `gdm/model.xgb` + `metadata.json`
- `ppd/model/` (Hugging Face DistilBERT dir) + `metadata.json`
- `mood/model/` (Hugging Face DistilBERT dir) + `metadata.json`

A model is SERVABLE only when the artifact directory contains both a valid
model payload AND a `metadata.json` from a real training run (see
`app/ml/artifact_store.py`). Otherwise the API reports `MODEL_UNAVAILABLE`
and never fabricates predictions.

See `docs/DATASETS.md` and `docs/ML_ARTIFACTS.md` for how to obtain datasets
and produce these artifacts.