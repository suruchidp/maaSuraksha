# MaaSuraksha — GDM Early-Risk Model Training Report

Status: **REAL TRAINING RUN COMPLETED — metrics are held-out, not fabricated.
SHAP was NOT computed (per instruction; artifact verification for SHAP is a
separate follow-up step).**

Related docs: `docs/GDM_MODEL_DESIGN.md` (design), `docs/GDM_DATASET_AUDIT.md`
(dataset audit), `docs/DATASETS.md` (dataset plan), `docs/ML_ARTIFACTS.md`
(artifact & training guide).

## 1. Dataset provenance / reference

Project-documented provenance (see `docs/GDM_DATASET_AUDIT.md` and
`metadata.dataset`):

- Local single-sheet workbook **`GDM-Final2022`** at
  `apps/ml-service/data/gdm/raw/dataset.xlsx`, mirrored value-for-value to
  `apps/ml-service/data/gdm/raw/dataset.csv`.
- Exact external origin and license are **unverified** and are recorded as such
  (`url: "local dataset supplied to the project (external origin unverified;
  not cited)"`, `doi: null`, `license: "locally supplied research copy; exact
  license to be confirmed"`). Confirmation is required before any deployment
  beyond the research context.
- **Dataset size:** 3,525 rows × 17 columns.
- Target `Class Label(GDM /Non GDM)`: **0 = Non GDM (2,153)**, **1 = GDM
  (1,372)**.

## 2. Model features (exact, 13)

Per `docs/GDM_MODEL_DESIGN.md` and `metadata.features` (order preserved):

```
age, bmi, hdl, pregnancy_count, previous_pregnancy_gestation, family_history,
unexplained_prenatal_loss, large_child_or_birth_defect, pcos, systolic_bp,
diastolic_bp, hemoglobin, sedentary_lifestyle
```

## 3. Excluded features and reasons

| Raw column | Reason it is excluded from the model |
|------------|--------------------------------------|
| `Case Number` | Row identifier; never a predictive feature. |
| `OGTT` | **Diagnostic glucose test** (Stage 2 clinical measurement). A Stage 1 pre-glucose screen must not consume the Stage 2 diagnostic result. Stored separately, never sent to the model. |
| `Prediabetes` | **Leakage**: equals the target in 3,082/3,525 rows (~87.4%), \|corr\| ≈ 0.74 with `gdm`. Including it would trivially reproduce the label. |

Also not present / not used: `fastingGlucose`, `postprandialGlucose`, `hba1c`,
`gestationalWeek`, `familyHistoryDiabetes`, `previousGDM` (no such columns exist
in this dataset; they are not fabricated or mis-mapped).

## 4. Preprocessing

- The loader (`scripts/common.py::load_gdm_early_risk_dataset`) maps raw
  display names → snake_case. **No value is changed, fabricated, imputed at
  load time, or remapped.**
- Feature missing values are **preserved** (NaN) and imputed with medians
  fitted on the **training split only**
  (`app/ml/tabular.py::defaults_from_frame`, `nanmedian` per feature over finite
  training values). The same medians are serialized as `metadata.defaults` and
  reused at inference for missing optional inputs.
- Boolean features are 0/1; boolean unknowns default to `false`.
- Stratified train / validation / test split, fixed seed `42` (0.70 / 0.15 /
  0.15). Imputation cannot leak: medians are never computed on validation/test.

Metadata `defaults`:

```
age 32.0 | bmi 27.5 | hdl 49.0 | pregnancy_count 2.0 |
previous_pregnancy_gestation 1.0 | family_history 1.0 |
unexplained_prenatal_loss 0.0 | large_child_or_birth_defect 0.0 | pcos 0.0 |
systolic_bp 132.0 | diastolic_bp 81.0 | hemoglobin 14.0 |
sedentary_lifestyle 0.0
```

## 5. Split sizes and class distribution

| Split | Rows | Compound 0 (Non GDM) | Class 1 (GDM) |
|-------|------|----------------------|---------------|
| Train | 2,467 | 1,507 (61.1%) | 960 (38.9%) |
| Validation | 529 | 323 (61.1%) | 206 (38.9%) |
| Test | 529 | 323 (61.1%) | 206 (38.9%) |

(Reproduced deterministically from the saved artifact; identical to training.)

## 6. Training configuration

- CPU-only XGBoost `XGBClassifier`, `tree_method="hist"`,
  `MAASURAKSHA_ML_THREADS=2` (bounded threads), seed `seed=42`, 800 trees max,
  `max_depth=5`, `learning_rate=0.05`, `subsample=0.8`,
  `colsample_bytree=0.8`, `min_child_weight=2`, early stopping (30 rounds) on
  validation, `eval_metric=logloss`. Reproducible command (from
  `apps/ml-service`, venv active):

  ```
  python -m scripts.train_gdm --dataset data/gdm/raw/dataset.csv
  ```

## 7. Selected threshold

- `thresholds.positive = 0.05`, selected by **F1-maximising sweep over the
  validation split** (`scripts/common.py::best_threshold`, 91 bins over
  [0.05, 0.95]) — **not** on the test set and not hard-coded.
- Validation metrics at that threshold: accuracy 0.9679, precision 0.9238,
  recall 1.0000, F1 0.9604, ROC-AUC 0.9969, PR-AUC 0.9951.

## 8. Held-out test metrics (single evaluation)

Evaluated **exactly once** on the held-out test split with the saved artifact
and the saved threshold. Values below are `metadata.metrics.test` AND were
independently recomputed from the saved artifact (match `True` for every
metric):

| Metric | Value |
|--------|-------|
| Accuracy | 0.9622 |
| Precision | 0.9115 |
| Recall | 1.0000 |
| F1 | 0.9537 |
| ROC-AUC | 0.9976 |
| PR-AUC | 0.9963 |

### Confusion matrix (test, labels: rows = true, cols = predicted)

```
                Predicted
                 Non GDM   GDM
True  Non GDM      303      20
      GDM            0      206
```

TN = 303, FP = 20, FN = 0, TP = 206.

Note: recall = 1.0000 at `positive = 0.05` means the screening threshold
catches every GDM case in the held-out test set at a cost of 20 false
positives. This is characteristic of a low (sensitive) screening threshold and
is reported as-is — nothing is smoothed or hidden.

## 9. Model version and dataset fingerprint

- `version`: **`20260916T065854Z`**
- `data_fingerprint`: **`505844dbe785d0ef`** (= first 16 hex chars of
  SHA-256 of `data/gdm/raw/dataset.csv`, `505844DBE785D0EF41D0BFF9D9A56746A1
  A88B3B576DE6F856133D3815F90933`). The raw XLSX SHA-256 remains
  `219DC849729D5D709289CE7BB3035F217B1B8380A2E9CEC76D3B48FACF50F3EC`
  (unchanged); the CSV is byte-identical to the post-audit conversion.
- `model_name`: `XGBClassifier`, `artifact_type`: `xgboost-classifier`.

## 10. Artifact paths

- Model: `apps/ml-service/artifacts/gdm/model.xgb` (220,886 bytes)
- Metadata: `apps/ml-service/artifacts/gdm/metadata.json` (3,227 bytes)
- Both were written **only after** successful training/evaluation. The GDM
  service now reports `MODEL_AVAILABLE`.

## 11. Post-training verification (this run)

1. **Artifact loads via the existing inference service** — `GDMService()` loads
   `model.xgb` + `metadata.json` through the production loading path
   successfully; `service.model_version = 20260916T065854Z`.
2. **Inference smoke test (valid input)** — realistic 13-feature input
   (age 29, BMI 26.5, HDL 48, gravida 2, previous gestation 1, family history
   yes, no unexplained loss / large child / previous defect, PCOS yes, BP
   124/80, Hb 11.2, sedentary yes) on the **booster directly (no SHAP)**:
   `prediction = positive`, `probability = 0.210139` at threshold 0.05.
3. **OGTT not a model feature** — `metadata.features` contains exactly the 13
   approved names; `GDMInput` has no `ogtt` field; a payload carrying
   `ogtt`/`prediabetes` is parsed with those extras ignored; the model matrix
   stays `(1×13)`.
4. **Prediabetes not a model feature** — same checks (excluded, no column, not
   in matrix).
5. **Missing optional values → saved defaults** — input omitting `bmi`, `hdl`,
   `systolic_bp`, `hemoglobin` is imputed with `metadata.defaults`
   (27.5 / 49.0 / 132.0 / 14.0) — verified equal to the saved training
   medians.
6. **Complete ML test suite** — **82 tests, all passed** (`pytest -q`).
7. **SHAP — intentionally NOT performed.** No `shap.TreeExplainer` /
   `compute_shap_values` call was made in this run; smoke inference used the
   raw booster (`predict_proba`) only, per the verification-is-independent
   requirement.

## 12. Test results summary

- `apps/ml-service` pytest: **82/82 passed**.
- (Backend `41` and frontend `24` tests were verified against the redesigned
  GDM schema in the design phase and are unaffected by this training run.)

## 13. Clinical safety statement

**This model is a Stage 1 GDM risk-assessment / decision-support tool, not a
diagnostic instrument.** It returns an early-risk probability from variables
available before any glucose testing. A `positive` result at the sensitive
screening threshold indicates the person should be referred for glucose
testing / closer monitoring; it does **not** establish a GDM diagnosis.
Glucose results (OGTT / fasting / postprandial / HbA1c) are Stage 2 clinical
measurements interpreted by a clinician and are deliberately excluded from the
model. The raw dataset has **unverified external provenance and license**, the
model is trained on a historical research cohort (not a locally representative,
consented cohort), and its performance is not clinically validated. This module
must never be used as the sole basis for a clinical decision, and any
deployment requires IRB-approved, consented, locally representative data plus
external validation.

## 14. Files produced/confirmed

- New artifact: `apps/ml-service/artifacts/gdm/model.xgb`, `metadata.json`
- Report: `docs/GDM_TRAINING_REPORT.md`
- Unchanged (verified by hash): `apps/ml-service/data/gdm/raw/dataset.xlsx`
  and `apps/ml-service/data/gdm/raw/dataset.csv`
- No source code changes were required for this training run (the approved
  pipeline from the design phase was used as-is).