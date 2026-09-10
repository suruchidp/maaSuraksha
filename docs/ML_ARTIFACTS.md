# MaaSuraksha — ML Artifacts & Training Guide

## Overview

The ML service never trains and never fabricates results. It serves real
inference **only** from trained artifacts under `apps/ml-service/artifacts/`.
Until an artifact exists, every inference endpoint returns
`model_status: "MODEL_UNAVAILABLE"` with prediction fields set to `null`.

## Model registry & artifact layout

| Model | Artifact path | Format |
|-------|---------------|--------|
| Maternal Risk | `artifacts/maternal_risk/` (`model.xgb` + `metadata.json`) | XGBoost `XGBClassifier` (binary) |
| GDM | `artifacts/gdm/` (`model.xgb` + `metadata.json`) | XGBoost `XGBClassifier` (binary) |
| PPD | `artifacts/ppd/` (`model/` HF dir + `metadata.json`) | DistilBERT sequence classifier (4 classes) |
| Mood | `artifacts/mood/` (`model/` HF dir + `metadata.json`) | DistilBERT sequence classifier (3 classes) |

An artifact is **SERVABLE** only when the payload exists AND `metadata.json`
is valid (version, trained_at, model_name, metrics, artifact_type; plus
features/defaults/target for tabular, labels for NLP). See
`apps/ml-service/app/ml/artifact_store.py`.

## Training pipeline (reproducible)

Datasets are placed in `apps/ml-service/data/<category>/raw/dataset.csv`
(Schema per `data/<category>/README.md`). Run from `apps/ml-service` with the
venv active:

```bash
python scripts/train_maternal_risk.py            # XGBoost, target `risk`
python scripts/train_gdm.py                      # XGBoost, target `gdm`
python scripts/train_ppd.py                      # DistilBERT, 4 severity classes
python scripts/train_mood.py                     # DistilBERT, 3 sentiment classes
```

Every training script:

- validates the dataset schema and fails loudly with a clear message otherwise,
- splits train/validation/test (stratified, fixed seed),
- optimises the decision threshold on validation (F1-max),
- reports real, held-out metrics on the test split,
- writes `model.xgb` (or the HF `model/` dir) + `metadata.json` containing
  those real metrics, version, features, defaults, thresholds and a dataset
  fingerprint.

Full plan and licensing notes: `docs/DATASETS.md`.

## Serving behaviour

- `GET /api/v1/models/status` — per-model availability + version + reason.
- Prediction endpoints return `model_status`:
  - `MODEL_AVAILABLE` → real prediction, probability, risk level, (SHAP where
    applicable), `model_version`.
  - `MODEL_UNAVAILABLE` → all result fields `null`, message explains what to do.
- SHAP values are computed only from a real loaded XGBoost model via
  `TreeExplainer`; any failure returns no SHAP rather than fake values.
- Mood: crisis/suicide detection is a deterministic keyword heuristic
  (en/hi/kn) that always runs; model-backed sentiment only when the artifact
  exists (`RULE_BASED` is clearly labelled when the model is absent).

## Backend integration

The backend calls the ML service best-effort via
`apps/backend/src/services/mlClient.ts` using `ML_SERVICE_URL`
(default `http://localhost:8000`). If the ML service is unreachable or returns
`MODEL_UNAVAILABLE`, assessments/mood entries remain `pending` with an
explanatory message — nothing is faked.

## Model status check

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/models/status
```