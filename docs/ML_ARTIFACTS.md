# MaaSuraksha — ML Artifacts & Training Guide

## Overview

The ML service never trains and never fabricates results. It serves real
inference **only** from trained artifacts under `apps/ml-service/artifacts/`.
Until an artifact exists, every inference endpoint returns
`model_status: "MODEL_UNAVAILABLE"` with prediction fields set to `null`.

## Model registry & artifact layout

| Model | Artifact path | Format |
|-------|---------------|--------|
| Maternal Risk | `artifacts/maternal_risk/` (`model.xgb` + `metadata.json`) | XGBoost `XGBClassifier` (binary, 6 features) |
| GDM (early-risk decision support) | `artifacts/gdm/` (`model.xgb` + `metadata.json`) | XGBoost `XGBClassifier` (binary, 13 features) |
| PPD | `artifacts/ppd/` (`model/` HF dir + `metadata.json`) | DistilBERT binary classifier (`postpartum \| no`) |
| Mood | `artifacts/mood/` (**not deployed** — no artifact exists; mood is `MODEL_UNAVAILABLE`) | — |

The Maternal Risk model trains on **exactly six features**
(`age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate`) sourced
from the UCI Maternal Health Risk dataset (DOI 10.24432/C5DP5D, CC BY 4.0).
Its target is binary: `0 = low/moderate risk`, `1 = high risk` (transformed
from the original three-class `RiskLevel`; `low risk + mid risk -> 0`,
`high risk -> 1`). BMI, gestational week and hemoglobin are not model features.

**Maternal Risk units — external vs internal.** The model was trained in the
dataset's NATIVE units: `blood_sugar` in **mmol/L** and `body_temp` in **°F**.
The application contract uses `bloodSugar` in **mg/dL** and `bodyTemp` in **°C**.
The service converts mg/dL → mmol/L (`/ 18`) and °C → °F (`× 9/5 + 32`) exactly
once at the model-input boundary (`app/ml/unit_conversion.py`); the artifact is
never retrained or modified. Missing values are imputed with the metadata
defaults, which are already in model units and are never re-converted. See
`docs/MATERNAL_RISK_UNIT_CONVERSION.md`.

The GDM model is a **Stage 1 early-risk decision-support** model (the
two-stage maternal-care workflow): it trains on the **13 early-risk features**
(`age, bmi, hdl, pregnancy_count, previous_pregnancy_gestation, family_history,
unexplained_prenatal_loss, large_child_or_birth_defect, pcos, systolic_bp,
diastolic_bp, hemoglobin, sedentary_lifestyle`) mapped from the local
`GDM-Final2022` sheet. Its target is binary `0 = Non GDM`, `1 = GDM`. It is
**not** a diagnostic tool: `OGTT` (diagnostic glucose test) and `Prediabetes`
(leakage: equals the target in ~87% of rows) are excluded from model features,
and fasting/postprandial glucose + HbA1c remain Stage 2 clinical measurements
stored in the health record but never sent to the model. See
`docs/GDM_MODEL_DESIGN.md`.

An artifact is **SERVABLE** only when the payload exists AND `metadata.json`
is valid (version, trained_at, model_name, metrics, artifact_type; plus
features/defaults/target for tabular, labels for NLP). See
`apps/ml-service/app/ml/artifact_store.py`.

## Training pipeline (reproducible)

Datasets are placed in `apps/ml-service/data/<category>/raw/dataset.csv`
(Schema per `data/<category>/README.md`). Run from `apps/ml-service` with the
venv active:

```bash
python -m scripts.train_maternal_risk               # XGBoost, target `risk`
python -m scripts.train_gdm                         # XGBoost, target `gdm`
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
  fingerprint (plus UCI provenance and the binary target definition for
  maternal risk).

Laptop-safe: tabular training bounds XGBoost threads via `MAASURAKSHA_ML_THREADS`
(default `2`); no GPU, no parallel training jobs.

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