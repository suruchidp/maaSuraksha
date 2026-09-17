# MaaSuraksha — GDM EARLY-RISK MODEL DESIGN (two-stage workflow)

Status: **DESIGN + SCHEMA + LOADER ONLY — NO GDM MODEL HAS BEEN TRAINED and no
`artifacts/gdm` payload is generated.** The raw files
(`data/gdm/raw/dataset.xlsx` / `dataset.csv`) are untouched.

Related docs: `docs/GDM_DATASET_AUDIT.md` (facts about the raw sheet),
`docs/DATASETS.md` (dataset plan), `docs/ML_ARTIFACTS.md` (artifact + training),
`apps/ml-service/data/gdm/README.md` (schema for training).

## 1. Purpose and clinical boundary

The module answers **"should this pregnant person be referred for glucose
testing / closer monitoring?"** — a Stage 1 screening/decision-support question
that must be answerable in the community with data available **before** any
diagnostic glucose test has been performed.

The module does **not** answer "does this person have GDM?" That diagnosis
belongs to Stage 2: clinical glucose testing (OGTT / glucose challenge) and
clinical interpretation.

Consequences that are enforced in code:

- The ML input schema (`GDMInput`, 13 features) contains **no glucose result**.
- `OGTT` (present in the raw sheet) is excluded from the model feature set and
  remains a **clinical measurement** in the record — it is collected and stored
  separately, never sent to the model.
- Prediction messages say "risk assessment / decision support", not
  "detection"/"diagnosis" (`app/models/gdm.py`).
- The backend stores optional `fastingGlucose` / `postprandialGlucose` /
  `hba1c` on the GDM record as Stage 2 clinical labs but **never forwards them**
  to `predictGDM` (`apps/backend/src/services/assessmentService.ts`).

## 2. Source data

- Local single-sheet workbook **`GDM-Final2022`** at
  `apps/ml-service/data/gdm/raw/dataset.xlsx`, mirrored byte-for-byte in values
  to `dataset.csv`. **3,525 rows, 17 columns.**
- External origin and license are **unverified**; recorded as local provenance
  (metadata `dataset.doi = null`, `url = local … (#unverified)`). See the audit
  before any production use.
- Target column `Class Label(GDM /Non GDM)` is already binary numeric
  (**0 = Non GDM: 2,153**, **1 = GDM: 1,372**) and maps to internal target
  `gdm`.

## 3. Model features (13, all genuine early-risk variables)

Single source of truth: `apps/ml-service/app/ml/tabular.py::GDM_FEATURES`.
Display-name → snake_case mapping: `scripts/common.py::GDM_CSV_COLUMN_MAP`.

| # | Model feature                 | Raw sheet column           | API field                    | Type | Input rule |
|---|-------------------------------|----------------------------|------------------------------|------|------------|
| 0 | `age`                         | Age                        | `age`                        | num  | required   |
| 1 | `bmi`                         | BMI                        | `bmi`                        | num  | optional   |
| 2 | `hdl`                         | HDL                        | `hdl`                        | num  | optional   |
| 3 | `pregnancy_count`             | No of Pregnancy            | `pregnancyCount`             | num  | required   |
| 4 | `previous_pregnancy_gestation`| Gestation in previous Pregnancy | `previousPregnancyGestation` | num| required   |
| 5 | `family_history`              | Family History             | `familyHistory`              | bool | default false |
| 6 | `unexplained_prenatal_loss`   | unexplained prenetal loss* | `unexplainedPrenatalLoss`    | bool | default false |
| 7 | `large_child_or_birth_defect` | Large Child or Birth Default* | `largeChildOrBirthDefect`  | bool | default false |
| 8 | `pcos`                        | PCOS                       | `pcos`                       | bool | default false |
| 9 | `systolic_bp`                 | Sys BP                     | `systolicBP`                 | num  | optional   |
| 10| `diastolic_bp`                | Dia BP                     | `diastolicBP`                | num  | required   |
| 11| `hemoglobin`                  | Hemoglobin                 | `hemoglobin`                 | num  | optional   |
| 12| `sedentary_lifestyle`         | Sedentary Lifestyle        | `sedentaryLifestyle`         | bool | default false |

\* Header spellings are inherited verbatim from the sheet ("unexplained prenetal
loss", "Large Child or Birth Default"). The intended clinical meaning of the
latter is "large child **or birth defect**". The loader maps by exact header
name and never alters raw values.

All 13 are **present in the source data** (so no feature is fabricated,
re-derived, or satisfied by an incorrect name). `bmi`, `hdl`, `systolic_bp`,
`hemoglobin` are optional at the API level (missing → train-split median).

## 4. Excluded columns and why

These stay in the raw files and are *never* model features
(`scripts/common.py::GDM_NON_FEATURE_COLUMNS`):

| Raw column | Reason |
|------------|--------|
| `Case Number` | Row identifier; would leak row ordering, not clinical risk. |
| `OGTT` | **Diagnostic glucose test** — this is the Stage 2 measurement that must NOT influence a Stage 1 pre-test screen (also would leak the answer). Remains a clinical measurement, not an input. |
| `Prediabetes` | **Leakage** — equals the target in 3,082/3,525 rows (~87.4%), |corr| ≈ 0.74 with `gdm`. Including it would trivially reproduce the label and hide what early-risk factors actually predict GDM. Kept in the raw file; left out of the model until its definition/timing is documented. |

Obsolete schema names (`fasting_glucose`, `postprandial_glucose`, `hba1c`,
`gestational_week`, `family_history_diabetes`, `previous_gdm`) are **not**
mapped backward onto unrelated columns. They are not present in this dataset
and are simply not features of the new model.

## 5. Target

- Column `Class Label(GDM /Non GDM)` → internal `gdm` = **0 (Non GDM) / 1 (GDM)**.
- The target is the sheet's binary label as recorded (no re-transformation of
  the label itself).

## 6. Missing-value strategy (no leakage, no fabrication)

From the audit: Sys BP 1,705 missing, BMI 1,081, HDL 1,001, OGTT 513; all other
features complete. (OGTT is not a model feature.)

- Feature NaNs are **preserved** by the loader (`load_gdm_early_risk_dataset`).
- Medians are computed **on the training split only**
  (`app/ml/tabular.py::defaults_from_frame`, `nanmedian` over finite values per
  feature) and applied to train/val/test.
- The same medians are serialized as `metadata.defaults` and used at inference
  for missing optional inputs (NaN **or** absent) —
  `tabular.row_to_matrix` now substitutes defaults for `None` and `NaN` alike.
- **No rows are deleted** (all 3,525 preserved); **no clinical value is
  fabricated or remapped**.
- Boolean unknowns are treated as `false`/0 (documented default), matching the
  `FeatureSpec` defaults.

## 7. Training pipeline (designed; not yet run)

Run from `apps/ml-service` (venv active):

```
python -m scripts.train_gdm --dataset data/gdm/raw/dataset.csv
```

`scripts/tabular_training.py::train_tabular` handles the `gdm` category via:

1. `common.load_gdm_early_risk_dataset(...)` — maps/validates schema, keeps NaN;
2. stratified split (0.70 / 0.15 / 0.15, seed 42);
3. `tabular.defaults_from_frame(train, "gdm")` — train-only medians;
4. same XGBoost recipe as maternal risk (800 trees max, depth 5, lr 0.05,
   thread-safe via `MAASURAKSHA_ML_THREADS`, early stopping on validation,
   F1-max threshold on validation → stored under `thresholds.positive`);
5. held-out test metrics computed and written to `metadata.json`
   (`dataset` includes local provenance; `target_definition` states the
   decision-support boundary).

No artifact is produced until this is explicitly run and approved; do not run
it as part of this design task.

## 8. Serving behaviour (when trained)

- `POST /api/v1/gdm/predict` accepts the 13 `GDMInput` fields (bmi/hdl/
  systolic_bp/hemoglobin optional; glucose fields not accepted).
- Returns `MODEL_AVAILABLE` only when a real `artifacts/gdm` payload exists;
  otherwise `MODEL_UNAVAILABLE` with `null` results — nothing is invented.
- `probability` rounded to 6 dp; prediction `positive`/`negative` at
  `thresholds.positive`; `risk_level` high/low; SHAP heat-map from the real
  booster via `TreeExplainer` (never static, `None` on any failure).
- Message: "risk assessment / decision support … not a clinical diagnosis".

## 9. Backend / frontend contract

- `packages/shared/src/validations.ts::gdmAssessmentSchema` — 13 early-risk
  fields; optional `fastingGlucose` / `postprandialGlucose` / `hba1c` accepted
  for Stage 2 storage only.
- Backend (`assessmentService.ts::createGDMAssessment`) stores clinical labs on
  the GDM record but sends **only** the 13 early-risk features to `predictGDM`.
- Frontend `GDMPanel` collects the 13 early-risk inputs (no glucose fields) and
  shows an honest note: early risk, attend glucose testing, not a diagnosis.
  `lib/schemas.ts`, `lib/mlUtils.ts`, and locale keys (en/hi/kn) mirror this.
- Result `riskFactors` wording: "Positive GDM risk screening (model)".
- Completion message: "GDM risk assessment completed … risk estimate for
  screening, not a clinical diagnosis."

## 10. What was (and was not) changed

Changed: GDM feature schema + loader + training branch; training script note;
`GDMInput`; `gdm.py` prediction message; backend GDM integration; shared
validation; frontend form/schema/labels/locales (en/hi/kn); ml-service tests
(+ new `test_gdm_schema.py`); docs (this design, audit cross-ref, `DATASETS`,
`ML_ARTIFACTS`, `API`, `data/gdm/README`).

Deliberately not done: **no training, no `artifacts/gdm` output**; raw
`dataset.xlsx` and `dataset.csv` untouched; no OGTT/Prediabetes/Case Number in
model features; no fabrication of glucose or any clinical value.

## 11. Safety boundaries (summary)

1. Model = screening decision-support, **not** diagnosis.
2. `OGTT`/glucose labs are Stage 2 clinical inputs only.
3. `Prediabetes` excluded (leakage).
4. Missing values handled with train-split medians, disclosed in metadata.
5. No artifact → honest `MODEL_UNAVAILABLE`.