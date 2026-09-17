# Maternal Risk — Unit Conversion Fix (Report)

Fixes the BLOCKER found during testing: the saved UCI Maternal Risk model
expects `blood_sugar` in **mmol/L** and `body_temp` in **°F**, while the
MaaSuraksha application contract uses **mg/dL** and **°C**. The model,
metadata and raw dataset were **not** modified. Instead the application now
converts user-facing units to the model's native units exactly once at the
model-input boundary.

Design + rationale: `docs/MATERNAL_RISK_UNIT_CONVERSION.md`
(conversion, unit-responsibility map, why the artifact is unchanged).

## 1. Files changed

Implementation (application, not model):

- `apps/ml-service/app/ml/unit_conversion.py` — **new**. Conversion constants and
  functions: `blood_glucose_mg_dl_to_mmol_l()` (`mg/dL / 18`),
  `temperature_celsius_to_fahrenheit()` (`°C × 9/5 + 32`), and
  `to_maternal_model_units(row)` — a non-destructive row copier that converts
  only the two features, leaves `None` (imputation defaults are already in model
  units) and non-numeric values untouched, and is intentionally non-idempotent
  so an accidental second conversion is detectable (no double conversion).
- `apps/ml-service/app/models/maternal_risk.py` — `predict()` now runs
  `unit_conversion.to_maternal_model_units(...)` on the dumped payload
  immediately before `row_to_matrix` (the model-input boundary). Docstring
  documents the boundary.
- `apps/ml-service/app/schemas/schemas.py` — `MaternalRiskInput` gains a
  docstring and per-field descriptions clarifying **external** units (mg/dL,
  °C) for `blood_sugar`/`body_temp` and that `bmi`/`gestational_week`/
  `hemoglobin` are not model features.
- `packages/shared/src/validations.ts` — comment on
  `maternalRiskAssessmentSchema` stating external units (mg/dL, °C) and pointing
  to the conversion module (no behavior change).

Tests:

- `apps/ml-service/tests/test_maternal_risk_units.py` — **new**, 11 tests.
- `apps/ml-service/tests/conftest.py` — toy-fixture clinical ranges for
  `maternal_risk` moved to the model's **internal** units (`blood_sugar`
  4–20 mmol/L, `body_temp` 95–104 °F) so the synthetic model is served values in
  the same distribution as it was trained on now that the service converts at
  the boundary. Explained in a comment; no external fixtures depend on the old
  ranges (all family assertions are range/key/shape-based).

Identification support (new, GDM untouched):

- `docs/MATERNAL_RISK_UNIT_CONVERSION.md` — canonical design/units doc.
- `docs/MATERNAL_GDM_TEST_REPORT.md` — addendum marking Finding 1 resolved.
- `docs/ML_ARTIFACTS.md`, `docs/API.md` — external-vs-internal unit notes.
- `docs/MATERNAL_RISK_UNIT_FIX_REPORT.md` — this report.

**Not modified:** `artifacts/maternal_risk/model.xgb`, `metadata.json`, all raw
datasets, all GDM artifacts (`gdm/model.xgb`, `metadata.json`), GDM code, PPD.

## 2. Tests added / changed

New `tests/test_maternal_risk_units.py` (11 tests) proves, per requirements:

1. `96 mg/dL → 5.333… mmol/L` (`/18` exact); `90 mg/dL → 5.0`.
2. `36.8 °C → 98.24 °F`; `37 °C → 98.6 °F`.
3. Conversion constant `BLOOD_GLUCOSE_MG_DL_PER_MMOL_L == 18` and the classic
   `37 °C ≡ 98.6 °F` marker are pinned.
4. `to_maternal_model_units` converts only sugar + temp, leaves all other
   features and the caller's dict untouched.
5. `None` and non-numeric values are left unconverted (imputation defaults are
   already model units; invalid values still raise the honest
   `InvalidInputError` path).
6. No double conversion: applying the boundary twice is detectably different
   (never a silent no-op), and the service passes exactly one conversion.
7. **What the model receives**: a captured `row_to_matrix` call shows the model
   gets `5.333 mmol/L` and `98.24 °F` for a 96/36.8 input, shaped `(1, 6)` with
   the 6 feature names.
8. Missing `blood_sugar`/`body_temp` → matrix column equals the metadata default
   (model units) — identical to plain `row_to_matrix`, proving defaults are not
   double-converted.
9. **Equivalence**: same clinical case via app units equals manually converting
   to native units and scoring (probability, prediction, risk level, SHAP).
10. Extra record fields (`bmi`, `gestational_week`, `hemoglobin`) still never
    enter the model (matrix `(1, 6)`, names exclude them, identical prediction
    with/without extras).

`tests/conftest.py` toy ranges updated (see §1). **No existing test was changed
to weaken an assertion**: all previous maternal-risk family tests were
range/shape/key-based and pass unchanged under the corrected contract (the toy
model now simply trains on the internal-unit ranges it is served).

## 3. Artifact SHA-256 before vs after (must be identical)

| Artifact | SHA-256 | Identical |
|----------|---------|-----------|
| `maternal_risk/model.xgb` | `25A65BEBA26C5793469078EEDE5B96D7FE7C85375673B989C610C177A32211AA` | **yes** |
| `maternal_risk/metadata.json` | `A61F4347BCABD18787069BBD9431A39077B1603A7A08B6AE20C68AFA81FCFF08` | **yes** |
| `gdm/model.xgb` | `9A4C97E192F7D95234A792DB7E14B13D9DA88AF274B03C2AB1480EDF5839D1F3` | **yes** |
| `gdm/metadata.json` | `BAE17447F71B25B3512BB8B8199037BAAECB5BF63EA44A99EDB02DE597F03124` | **yes** |

Verified before the change, immediately after the change, and after all test
runs. All identical.

## 4. Test counts (all re-run after the change)

| Suite | Result |
|-------|--------|
| ML pytest (`apps/ml-service`) | **93 passed** (82 prior + 11 new) |
| Backend vitest (`apps/backend`, port 8000 closed) | **41 passed** (7 files) |
| Frontend vitest (`apps/frontend`) | **24 passed** (5 files) |
| Typecheck (repo root) | **PASS** (shared, backend, frontend `tsc --noEmit`) |
| Production build (repo root) | **PASS** (shared → frontend `vite build` 19.0s → backend `tsc`) |

Known build warnings (unchanged, non-blocking): frontend main chunk 1,153 kB
(> 500 kB), `education.ts` both dynamically and statically imported.

## 5. Sample predictions (real artifact, version `20260916T053033Z`)

Clinical case: `age 35 · BP 120/80 · blood_sugar 96 mg/dL · body_temp 36.8 °C · HR 76`.

| | Probability | Risk | Model received |
|---|---|---|---|
| **Before fix** (bug: 96 read as 96 mmol/L, 36.8 °C as °F) | **0.883091** | high | out-of-distribution magnitudes |
| **After fix** (boundary conversion) | **0.012284** | low | `5.3333 mmol/L`, `98.24 °F` |
| Manual conversion equivalence | **0.012284** | low | identical to after-fix ✓ |

Real-artifact verification re-run (`verify` script, `docs/MATERNAL_RISK_UNIT_CONVERSION.md`
§Verification): **18/18 PASS**, including:
- low-risk case (84 mg/dL, 36.9 °C) → p=0.010401 low
- high-risk case (324 mg/dL, 39.4 °C) → p=0.989329 critical
- borderline case (180 mg/dL, 37.2 °C) → p=0.433431 high
- SHAP: exactly 6 features, additive with constant base ≈ −0.9773, reconstructs
  the probability to <1e-4
- extras excluded → identical prediction; missing values → model-unit defaults
  (7.5 mmol/L, 98.0 °F) with no double conversion; non-numeric → MODEL_UNAVAILABLE
  (nothing fabricated); artifact-absent → MODEL_UNAVAILABLE

## 6. Requirement compliance

1. User-facing units stay mg/dL + °C — no frontend/consumer change. ✓
2. Saved model unchanged (hashes identical). ✓
3. Conversion only at model-input boundary (`MaternalRiskService.predict`). ✓
4. No double conversion (single point, defaults never converted, non-idempotent guard; proven by tests). ✓
5. Explicit + documented (`unit_conversion.py` docstrings, `docs/MATERNAL_RISK_UNIT_CONVERSION.md`). ✓
6. ML schema, shared validation and docs now state external/internal units. ✓
7. All six features preserved; only `blood_sugar`/`body_temp` converted. ✓
8. Tests added proving each conversion and no-double-conversion/exclusion/equivalence. ✓
9. Maternal Risk verification re-run on the real artifact (18/18). ✓
10. Complete ML suite re-run (93 passed). ✓
11. Backend (41) + frontend (24) suites re-run. ✓
12. Typechecks + production builds re-run. ✓
13. Maternal artifact SHA-256 identical before/after (and GDM too). ✓
14. GDM not modified. ✓
15. PPD / new features not started. ✓
16. Documentation section added (`docs/MATERNAL_RISK_UNIT_CONVERSION.md`). ✓
17. This report. ✓

## 7. Remaining issues (honest list)

- **Pre-existing, unchanged:** ML `body_temp` schema bounds (35–42 °C) differ
  from shared validation (33–43 °C). Recorded; not changed in this fix. The
  stricter ML bound governs what reaches the model.
- **Pre-existing, unchanged:** training `HeartRate` min = 7 vs schema min = 30 —
  unrelated to the unit bug; left as-is.
- **Historical records:** maternal-risk assessments stored BEFORE this fix were
  scored with the pre-fix (out-of-distribution) semantics. No backfill/re-scoring
  was performed (no fabrication); any production DB rows can be re-submitted if
  desired.
- **Superseded documentation numbers:** the buggy sample prediction
  `p≈0.846`/`0.008` cited in earlier notes reflected a different hand-computed
  case and are replaced by the measured values above.

No artifacts, datasets, or GDM/PPD code were touched.