# MaaSuraksha — Maternal Risk Dataset & Pipeline Preparation Report

Status: **PREPARATION + VERIFICATION ONLY — NO TRAINING PERFORMED**

## What changed

The Maternal Risk training pipeline was re-wired to consume the **official UCI
Maternal Health Risk dataset** and to train an XGBoost model on **exactly six
measured predictors**. BMI, gestational week and hemoglobin remain in
MaaSuraksha patient records / DTOs / frontend, but they are **not** features of
this model and are never passed to XGBoost.

The training script now:

1. Validates required columns exactly (six features + `risk`).
2. Validates numeric types.
3. Rejects missing required feature values (no imputation of the six features,
   no synthetic values).
4. Validates the target after transformation (binary `{0, 1}`, both classes).
5. Never creates synthetic clinical values.
6. Never fabricates metrics (metrics only from held-out predictions).
7. Splits train/validation/test via the existing reproducible stratified
   approach with a fixed seed (default `42`, `--seed` overridable).
8. Optimises the decision threshold on validation (F1-max, existing).
9. Reports real held-out test metrics only.
10. Writes `model.xgb` + `metadata.json` only after successful training.
11. Records the dataset fingerprint (SHA-256 prefix) in metadata.
12. Records dataset source / URL / DOI / license in metadata.
13. Records the exact six model features in metadata.
14. Records the binary target definition in metadata (distinct from the
    original three-class UCI target).
15. Preserves `MODEL_UNAVAILABLE` behavior when no valid artifact exists.

## Official dataset

| Field | Value |
|---|---|
| Dataset | UCI Maternal Health Risk |
| Source | UCI Machine Learning Repository |
| URL | https://archive.ics.uci.edu/dataset/863/maternal+health+risk |
| DOI | 10.24432/C5DP5D |
| License | CC BY 4.0 |
| Records | 1,013 |

## Original features (UCI)

- `Age`
- `SystolicBP`
- `DiastolicBP`
- `BS` (blood sugar)
- `BodyTemp`
- `HeartRate`

## Original target

`RiskLevel` — three classes: `low risk`, `mid risk`, `high risk`.

## MaaSuraksha model features

```
age
systolic_bp
diastolic_bp
blood_sugar
body_temp
heart_rate
```

The raw UCI download is accepted by the training script and mapped
automatically:

| UCI | MaaSuraksha |
|---|---|
| Age | age |
| SystolicBP | systolic_bp |
| DiastolicBP | diastolic_bp |
| BS | blood_sugar |
| BodyTemp | body_temp |
| HeartRate | heart_rate |
| RiskLevel | risk |

## Target transformation

```
low risk  -> 0
mid risk  -> 0
high risk -> 1
```

Documented as `0 = low/moderate risk`, `1 = high risk`. This binary target is
**not** the original three-class UCI `RiskLevel` and is clearly distinguished in
`metadata.json` (`target_definition`) and in the documentation.

### Application distinction (explicit)

BMI, gestational week and hemoglobin are **NOT training features** because they
are not present in the selected UCI dataset. They continue to exist in patient
health records, the `HealthMetric` model, `PregnancyProfile`, API DTOs,
clinical views, dashboards and frontend forms. They are simply not used by the
trained Maternal Risk model and do not appear in its metadata `features`.

## Files changed

Tracked in git:

- `apps/ml-service/app/ml/tabular.py` — `MATERNAL_RISK_FEATURES` reduced to the
  six UCI predictors (BMI/gestational_week/hemoglobin removed as model
  features; inference ignores them).
- `apps/ml-service/app/core/config.py` — new `MAASURAKSHA_ML_THREADS` setting
  (default `2`, clamped to the machine's CPU count).
- `apps/ml-service/scripts/common.py` — UCI→snake_case mapping, binary target
  transform, `normalize_maternal_risk()` / `load_maternal_risk_dataset()`,
  dataset provenance + `target_definition` in `compose_tabular_metadata()`;
  scikit-learn imports deferred so schema tests run where WDAC blocks native
  wheels.
- `apps/ml-service/scripts/tabular_training.py` — maternal-risk-specific dataset
  loader branch, bounded `n_jobs` from settings, `tree_method=hist` (CPU / low
  memory), dataset + target-definition metadata.
- `apps/ml-service/scripts/train_maternal_risk.py` — updated note/docstring.
- `apps/ml-service/tests/conftest.py` — toy-fixture clinical ranges now match
  the six-feature contract.
- `apps/ml-service/tests/test_preprocessing.py` — six-feature expectations;
  extra-field-not-a-feature check; GDM optional-imputation test.
- `apps/ml-service/tests/test_maternal_risk_schema.py` — **new**, 23 tests.
- `apps/ml-service/data/README.md` — maternal risk schema line.
- `docs/DATASETS.md` — maternal risk row/section, preprocessing scope note,
  laptop-safe training notes.
- `docs/ML_ARTIFACTS.md` — six-feature + provenance + thread notes.
- `.env.example` — `MAASURAKSHA_ML_THREADS=2`.

Updated on disk (pre-existing `.gitignore` keeps `data/*/` untracked):

- `apps/ml-service/data/maternal_risk/README.md` — six-feature schema, UCI
  provenance, explicit transform and non-feature statement for BMI /
  gestational week / hemoglobin.

## Tests run

ML-service test suite (venv at `C:\Users\psuru\AppData\Local\Temp\opencode\maasuraksha-ml-venv`):

```
python -m pytest tests -q
```

Result: **74 tests collected, 74 passed, exit code 0** (including all 23 new
schema/pipeline tests + the existing MODEL_UNAVAILABLE / honesty / SHAP / toy
artifact tests). One transient note: the system's Windows WDAC / Application
Control policy blocks scipy native wheels on first load; the scikit-learn
imports in `scripts/common.py` were made function-local so the pure-python
schema tests execute safely under the policy, and the full suite (including
scikit-learn-backed evaluation) goes green once loaded.

Workspace verification:

- `npm run typecheck` → pass (shared, backend, frontend; ml-service is the
  Python no-op echo).
- `npm run build` → pass, exit 0 (shared `tsc`, frontend `tsc -b && vite build`
  succeeded, backend `tsc`).
- Backend / frontend unit suites were **not** run: no backend, frontend or
  shared TypeScript contracts were changed (ML DTO fields `bmi`,
  `gestational_week`, `hemoglobin` are intentionally retained and simply
  ignored by the six-feature model).

## Verification results

- ML-service tests: **PASS (74/74)**.
- Workspace typecheck: **PASS**.
- Workspace build: **PASS**.
- `get_booster()/row_to_matrix` runtime smoke: **PASS** (`app.main` imports;
  `feature_names("maternal_risk")` returns the six features; threads default `2`).

## Laptop-safe CPU / thread configuration

- `MAASURAKSHA_ML_THREADS` (default **2**) bounds XGBoost `n_jobs`; validated
  and clamped to `[1, os.cpu_count()]` via the settings validator (tested).
- `tree_method=hist` (CPU-efficient, lower memory).
- No GPU, no parallel training jobs, no multi-model concurrency.
- Early stopping on validation is preserved.
- No arbitrary training-time performance claims are made.

## Confirmations

1. **No model training was performed** during this task.
2. **No synthetic clinical training data was generated.** The only synthetic
   values in the repo are the pre-existing, clearly-labelled test fixtures used
   to exercise loading/inference code paths (they never feed the training
   pipeline or a dataset file).
3. **The training dataset has NOT been placed or generated** —
   `apps/ml-service/data/maternal_risk/raw/` does not exist.
4. **No model artifact was generated** — no `model.xgb` / `metadata.json`
   exists under `apps/ml-service/artifacts/`; `MODEL_UNAVAILABLE` remains in
   effect.

## Exact command to train Maternal Risk later

From the repository root:

```
cd apps/ml-service
python scripts/train_maternal_risk.py --dataset data/maternal_risk/raw/dataset.csv
```

The script also runs without `--dataset` (defaults to
`data/maternal_risk/raw/dataset.csv`) and accepts the raw UCI download
(`Age`/`SystolicBP`/`DiastolicBP`/`BS`/`BodyTemp`/`HeartRate`/`RiskLevel`) via
automatic column and label mapping.

## Stopping point

Stopped after dataset/pipeline preparation and verification as instructed.
No GDM, PPD or Mood pipeline was modified, and no model was trained.