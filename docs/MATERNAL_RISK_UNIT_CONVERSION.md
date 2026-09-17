# Maternal Risk — Unit Conversion at the Model Boundary

## Why this exists

The saved UCI Maternal Health Risk model (`apps/ml-service/artifacts/maternal_risk/`)
was trained on the raw UCI Maternal Health Risk dataset (DOI 10.24432/C5DP5D)
in the dataset's **native units**:

| Feature | Training (internal) unit | Training range (approx) | Training median |
|---------|--------------------------|--------------------------|-----------------|
| `blood_sugar` | mmol/L | 6.0 – 19.0 | 7.5 |
| `body_temp` | °F (Fahrenheit) | 98 – 103 | 98.0 |

The MaaSuraksha **application contract** (backend schema, shared validation and
frontend labels) expresses the same two inputs in everyday clinical units:

| Feature | External (application) unit | Schema bounds |
|---------|------------------------------|---------------|
| `bloodSugar` → `blood_sugar` | mg/dL | 20 – 500 |
| `bodyTemp` → `body_temp` | °C (Celsius) | 35 – 42 |

Without conversion, values entered in application units were fed to the model
untouched (e.g. `96 mg/dL` read as `96 mmol/L`, `36.8 °C` read as `36.8 °F`),
which is far outside the model's training distribution and produced clinically
meaningless probabilities.

## What we did (and did NOT do)

- **Did NOT retrain** the Maternal Risk model.
- **Did NOT modify or replace** `model.xgb`, `metadata.json`, or the raw dataset.
  The artifact hash is unchanged (see the verification section below).
- **Added a documented conversion at the model-input boundary only** — the last
  millisecond before the row is passed to XGBoost
  (`app/models/maternal_risk.py` → `app/ml/unit_conversion.py`).

## The conversion (standard clinical formulas)

```
mmol/L = mg/dL / 18
°F     = °C × 9/5 + 32
```

Applied **once**, to **user-provided values only**:

- `blood_sugar`: `96 mg/dL → 5.333 mmol/L`
- `body_temp`: `36.8 °C → 98.24 °F`

Missing values are left untouched (`None`): the imputation layer fills them with
the saved training-split medians from `metadata.json` `defaults`, which are
**already in model units** (`7.5` mmol/L, `98.0` °F). Defaults are therefore
never re-converted — there is no double conversion by construction, and the
conversion function is intentionally **non-idempotent** (applying it twice
produces detectably different values) so an accidental second conversion cannot
hide.

## Unit responsibility map

| Layer | Units used |
|-------|------------|
| Frontend labels (`i18n`) | mg/dL, °C |
| Shared validation (`packages/shared`) | mg/dL (20–500), °C (33–43) |
| Backend DTO / persistent record | mg/dL, °C |
| ML service schema (`MaternalRiskInput` bounds) | mg/dL (20–500), °C (35–42) — **external** |
| `unit_conversion.to_maternal_model_units()` | the ONLY conversion point |
| XGBoost inputs / `metadata.defaults` / SHAP | mmol/L, °F — **internal** |

GDM is **not** affected: no glucose/temperature feature is converted, and every
other Maternal Risk feature (`age`, `systolic_bp`, `diastolic_bp`,
`heart_rate`) passes through unchanged.

## Verification

- 11 dedicated unit/boundary tests added (`apps/ml-service/tests/test_maternal_risk_units.py`),
  incl. `96 mg/dL ≈ 5.333 mmol/L`, `36.8 °C ≈ 98.24 °F`, "converted values are
  what the model receives", app-units == manual-conversion equivalence, no
  double conversion, and extra-record-fields-never-enter-the-model.
- Maternal Risk verification re-run against the real artifact (see
  `docs/MATERNAL_GDM_TEST_REPORT.md`).
- Full ML suite: **93 passed**.
- Artifact SHA-256 identical before/after (see hashes in the test report).