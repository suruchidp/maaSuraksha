# Assessment Required-Field Design (Maternal Risk & GDM)

This documents why some assessment fields show a required "\*" and others do not. The
required/optional matrix is **intentional and data-driven** — it is derived from the
validation schemas and mirrors the trained models' input contracts exactly.

## Single source of truth

- **Validation**: `packages/shared/src/validations.ts` (backend/API truth) mirrored by the
  frontend `apps/frontend/src/lib/schemas.ts` (`buildSchemas`, i18n-aware).
- **Backend**: routes validate with the shared schemas via `validate(...)`, e.g.
  `apps/backend/src/routes/assessments.ts` → `validate(gdmAssessmentSchema)`, and forward the
  validated features to the ML service (no separate requiredness logic).
- **UI markers**: `apps/frontend/src/components/assessments/AssessmentPanels.tsx`
  (`requiredFlags`, `!shape[field].isOptional()`) — the "\*" is derived from the schema, so it
  cannot drift from validation.
- **Tests**: the full required/optional matrix is locked in
  `apps/frontend/src/components/assessments/AssessmentPanels.test.tsx`
  ("AssessmentPanels required indicator matrix (live finding)").

## GDM — Systolic BP optional vs. Diastolic BP required (INTENTIONAL)

The asymmetry is **deliberate** and follows directly from the training data.

| Evidence | File |
|---|---|
| Raw-data missingness: **Sys BP 1,705 / 3,525 rows (48.4%)**, **Dia BP 0 (0.0%)** | `docs/GDM_DATASET_AUDIT.md` §4 |
| Model feature input rules: `systolic_bp` = optional, `diastolic_bp` = required | `docs/GDM_MODEL_DESIGN.md` §3 |
| Missing-value strategy: absent optional → train-split median (`metadata.defaults`) | `docs/GDM_MODEL_DESIGN.md` §6, `app/ml/tabular.py::row_to_matrix` |
| Feature missingness: `diastolic_bp` 0, `systolic_bp` 1705 (48%) | `docs/GDM_ARTIFACT_VERIFICATION.md` |
| ML serving schema: `diastolic_bp` required, `systolic_bp` optional | `apps/ml-service/app/schemas/schemas.py::GDMInput` |

Pattern: the **required** fields (`age`, `pregnancy_count`, `previous_pregnancy_gestation`,
`diastolic_bp`) are exactly the features with **complete** training data (0% missing), while the
**optional** fields are the ones a community/Stage-1 screen may lack: `bmi` (31% missing),
`hdl` (28% missing) and `systolic_bp` (48% missing). `hemoglobin` is also optional — a lab value
that may not be available before glucose testing — and the model imputes its training median when
absent.

When a systolic reading is left blank, the model does **not** simply drop the feature: it
substitutes the saved train-split median (`systolic_bp → 132.0 mmHg`) so the prediction and SHAP
values are computed on the same matrix the model was trained on. The explainability UI states this
honestly: `Patient value: Not recorded` / `Model used: 132 mmHg · imputed from training data`.

**Conclusion: do NOT change this.** Making both systolic and diastolic BP required would contradict
the documented, data-driven model design — the model is intentionally calibrated to screen
correctly without a systolic reading. To remove the product confusion, the GDM panel shows a hint
under Systolic BP (`assessments.gdm.systolicOptionalHint` in en/hi/kn) explaining exactly this.

## Maternal Risk — six model inputs required; BMI/GW required clinical-record fields; Hemoglobin optional (INTENTIONAL)

| Field | Required? | Why |
|---|---|---|
| age, systolicBP, diastolicBP, bloodSugar, bodyTemp, heartRate | yes | The six trained model features. The UCI dataset is complete and the loader **rejects** missing values (`scripts/common.py::normalize_maternal_risk`), so all six are required in the app and ML input contracts. |
| bmi, gestationalWeek | yes | **Recorded clinical information**, not model features. The app schema requires them for the health record; they are never passed to XGBoost (the model matrix is exactly the six features — `app/ml/tabular.py::MATERNAL_RISK_FEATURES`). The panel note (`assessments.maternal.note`) says this. |
| hemoglobin | no | Optional clinical-record field; not a model feature. |

Model feature list (single source of truth): `app/ml/tabular.py::MATERNAL_RISK_FEATURES`
(6 features) and the artifact metadata `apps/ml-service/artifacts/maternal_risk/metadata.json`.

## Change history

- None made to schemas, models, or inference this document is a confirmation exercise.
  Requiredness was verified against the actual Zod schemas and against the trained models'
  data assumptions (dataset audits + design docs + metadata `defaults`).