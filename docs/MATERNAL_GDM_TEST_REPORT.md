# MaaSuraksha — Maternal Risk & GDM Test Report

Scope: comprehensive testing of the completed Maternal Risk and GDM modules
against the **real saved artifacts** (`apps/ml-service/artifacts/`). No
retraining; no artifact modified; nothing fabricated. All predictions/SHAP in
this report were produced by the saved models.

Related docs: `docs/GDM_ARTIFACT_VERIFICATION.md`, `docs/GDM_SHAP_VERIFICATION.md`,
`docs/GDM_MODEL_DESIGN.md`, `docs/GDM_TRAINING_REPORT.md`.

> **UPDATE (post-report):** §6 FINDING 1 (Maternal Risk unit mismatch) has been
> resolved in the application layer without touching the artifact — the ML
> service now converts `blood_sugar` mg/dL→mmol/L (`/18`) and `body_temp`
> °C→°F (`×9/5+32`) exactly once at the model-input boundary
> (`app/ml/unit_conversion.py`). See `docs/MATERNAL_RISK_UNIT_CONVERSION.md`.
> Artifact hashes remain identical; the ML suite grew to **93 passed**.

---

## 0. Artifact integrity — hashes BEFORE vs AFTER (identical)

| Artifact | SHA-256 BEFORE | SHA-256 AFTER | Status |
|----------|----------------|---------------|--------|
| `maternal_risk/model.xgb` | `25A65BEBA26C5793469078EEDE5B96D7FE7C85375673B989C610C177A32211AA` | same | unchanged |
| `maternal_risk/metadata.json` | `A61F4347BCABD18787069BBD9431A39077B1603A7A08B6AE20C68AFA81FCFF08` | same | unchanged |
| `gdm/model.xgb` | `9A4C97E192F7D95234A792DB7E14B13D9DA88AF274B03C2AB1480EDF5839D1F3` | same | unchanged |
| `gdm/metadata.json` | `BAE17447F71B25B3512BB8B8199037BAAECB5BF63EA44A99EDB02DE597F03124` | same | unchanged |

Hashes captured before any testing and again after all suites + live
integration. All four unchanged. The raw XLSX/CSV datasets were not touched.

## 1. Maternal Risk (real artifact, version `20260916T053033Z`, fingerprint `a1f7025719f84715`)

### Checks performed (verified via `verify_maternal_test.py`, read-only)

| # | Check | Result | Observed |
|---|-------|--------|----------|
| 1 | Saved model loads via `MaternalRiskService._load()` | PASS | `MODEL_AVAILABLE`, version matches metadata |
| 2 | Exactly the expected 6 model features, ordered | PASS | `age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate` |
| 3 | Normal/low-risk input → real prediction | PASS | age25/BP110/75/BS7.4/T98.6/HR74 → probability **0.044808**, `low` |
| 4 | High-risk input → real prediction | PASS | age60/160/100/18/103/90 → probability **0.989329**, prediction `high`, level `critical` |
| 5 | Borderline/threshold input | PASS | scan near `high_risk=0.15` cut → probability **0.207122**, `high` (just above cut) |
| 6 | Probability/risk from the real model (not mocked) | PASS | produced via XGBoost `predict_proba` |
| 7 | SHAP from the saved model | PASS | 6 keys, real values, additive to 1.3e-8 (LOW) / 3.2e-8 (HIGH) in log-odds space |
| 8 | SHAP exactly the 6 model features | PASS | key set = feature set; values (LOW) `blood_sugar −1.057, systolic_bp −0.512, body_temp −0.397…` |
| 9 | Extra app fields (bmi, gestational_week, hemoglobin) do NOT enter the model | PASS | matrix stays `(1,6)`; names = 6 features; identical prediction with/without extras |
| 10 | Invalid inputs / validation | PASS | non-numeric `age` → `MODEL_UNAVAILABLE`, probability `None` (no fabrication); out-of-range `age`/`body_temp` rejected by API schema (pydantic) |
| 11 | MODEL_UNAVAILABLE without touching real artifact | PASS | empty artifacts dir → `MODEL_UNAVAILABLE`, prediction/SHAP `None`, honest reason |

### Behavioral note (not a fabrication)
Missing values for the 6 features are **imputed with the saved training-split
medians** (all six have a default in `metadata.defaults`) rather than rejected —
e.g. missing `heart_rate` → 76.0. Deterministic and honest, but "required" is
effectively soft at inference time (see §7 Finding 2).

## 2. GDM (real artifact, version `20260916T065854Z`, fingerprint `505844dbe785d0ef`, threshold 0.05)

### Checks performed (verified via `verify_gdm_test.py`, read-only)

| # | Check | Result | Observed |
|---|-------|--------|----------|
| 1 | Loads via `GDMService._load()` | PASS | `MODEL_AVAILABLE` |
| 2 | Exactly the approved 13 features | PASS | full list matches `metadata.features` and `tabular.feature_names("gdm")` |
| 3 | Low-risk input | PASS | probability **0.005597**, `negative`, `low` |
| 4 | High-risk input | PASS | probability **0.982167**, `positive`, `high` |
| 5 | Intermediate/borderline input | PASS | probability **0.612281**, `positive`, `high` |
| 6 | Probability/classification from the real model | PASS | `predict_proba` on saved booster |
| 7 | SHAP exactly the 13 approved features | PASS | independent full SHAP == all 13 for all three inputs; additive to 1.3e-8 / 5.8e-8 / 2.2e-7; production `predict` returns the documented top-10 display subset |
| 8 | Case Number / OGTT / Prediabetes cannot enter the Stage-1 matrix | PASS | payload with the three extra keys → `row_to_matrix` still `(1,13)`, names exclude all three; SHAP never contains them |
| 9 | Missing optional values use saved training defaults | PASS | omitting bmi/hdl/systolic_bp/hemoglobin → imputed to 27.5/49.0/132.0/14.0; imputed-vs-explicit identical prediction; NaN → defaults at matrix level; API numerically and schema-rejects `NaN` optionals |
| 10 | Invalid inputs / validation | PASS | non-numeric `age` → `MODEL_UNAVAILABLE`, probability `None`; `age=200` rejected by schema |
| 11 | MODEL_UNAVAILABLE without touching real artifact | PASS | empty artifacts dir → `MODEL_UNAVAILABLE`, everything `None` |
| 12 | SHAP differ appropriately across inputs | PASS | max |Δ| ≈ 3.4 between LOW/HIGH (bmi −1.80 → +1.61 etc.) |

## 3. Backend integration

### Existing suite — PASS (41/41 across 7 files)
`npm.cmd run test` in `apps/backend`:
`auth.test.ts` (11), `rbac.test.ts` (6), `patients.test.ts` (5),
`ownership.test.ts` (8), `ml-honesty.test.ts` (4), `validation.test.ts` (7),
`health.test.ts` (2). These cover:

- **Authentication/RBAC** — register/login/JWT, password never exposed, deactivated
  accounts rejected, ADMIN-only endpoints, caregiver role restrictions, chat
  role rules.
- **Patient ownership/access** — patient reads only own metrics; ASHA/DOCTOR read
  only assigned patients; explicit `userId` required for caregivers; 404 vs 403
  semantics.
- **Persistence** — assessments/metrics/mood docs created and stored correctly.
- **ML honesty (no fabrication when unavailable)** — with no ML service running,
  maternal-risk/GDM/PPD/mood endpoints store `pending` records with NO
  score/classification/sentiment and an honest "not available… nothing was
  invented" message (4 tests).

### Live end-to-end: backend → real ML service → persistence (temporary tests, then removed)
Started the real ML service (`uvicorn app.main:app` on `127.0.0.1:8000`;
maternal_risk + gdm `MODEL_AVAILABLE`), set `ML_SERVICE_URL=http://127.0.0.1:8000`,
and ran two temporary integration tests (deleted afterwards):

- **maternal-risk completed** — POST `/api/v1/assessments/maternal-risk` → `201`,
  `status=completed`, numeric `riskScore`, `riskLevel` set, `modelVersion=20260916T053033Z`,
  `shapValues` ≤ 6 keys, message “completed by the ML service”; record retrievable
  by the owning patient through `GET /assessments/maternal-risk`. **PASS**
- **GDM completed + Stage-2 storage** — POST `/api/v1/assessments/gdm` → `201`,
  `status=completed`, `riskScore` number, `modelVersion=20260916T065854Z`,
  `shapValues` ≤ 10 keys; `fastingGlucose: 95` and `postprandialGlucose: 160` are
  **persisted on the record but are never model features** (verified at ML level,
  §2 #8); retrievable via `GET /assessments/gdm/latest/:userId`. **PASS**

### Audit logging redaction (temporary test, then removed)
Registered + logged in a user, wrote a mood-journal entry with sensitive text,
then scanned every stored `AuditLog` document for the plaintext password
(`SuperSecretPw1`), the user's JWT, and the journal text. **PASS** — audit
entries for `register`/`login` exist (action/resource/user/IP only) and contain
**no password, no token, and no mood/journal text**. (`analysis/moodController`
and all callers never pass sensitive payloads to `logAudit`; verified
empirically against the in-memory Mongo.)

## 4. Regression — complete existing suites

| Suite | Command | Result |
|-------|---------|--------|
| ML | `python -m pytest` (in `apps/ml-service`, venv) | **82 passed** (exit 0) |
| Backend | `npm.cmd run test` (in `apps/backend`) | **41 passed**, 7 files (exit 0) |
| Frontend | `npm.cmd run test` (in `apps/frontend`) | **24 passed**, 5 files (exit 0) |
| Typecheck | `npm.cmd run typecheck` (repo root, workspaces) | **PASS** — shared, backend, frontend `tsc --noEmit`; ml-service = n/a (echo) |
| Builds | `npm.cmd run build` (repo root: shared → frontend → backend) | **PASS** — frontend `tsc -b && vite build` (✓ built in 20.1s); backend `tsc`; shared `tsc` |

Backend suite was run twice (before and after the temporary live/audit test
files), both 41/41 — the temp files were deleted, so the checked-in suite is
unchanged and green.

## 5. Warnings (non-blocking, all observed during runs)

1. Vite build: main chunk `index-*.js` **1,153 kB** (> 500 kB chunk-size
   warning) — a bundling improvement, not a failure.
2. Vite build: `src/services/education.ts` both dynamically and statically
   imported by `src/hooks/queries.ts` — D/I hint, not a failure.
3. XGBoost logs UBJSON save/load notices (`Unknown file format: 'xgb'`,
   saving defaults to UBJSON) — benign; `model.xgb` loads on the production path
   in every check.
4. `StarletteDeprecationWarning` / `httpx2` + `anyio` deprecations inside ML
   test dependencies — cosmetic.

## 6. Bugs / findings discovered (reported clearly, NOT silently fixed)

**FINDING 1 — HIGH / BLOCKER for Maternal Risk browser testing: unit/scale
mismatch between the app contract and the trained model.**
The maternal model was trained on the raw UCI dataset in its native units —
`blood_sugar` in **mmol/L (training range 6–19, median 7.5)** and `body_temp` in
**°F (training range 98–103, median 98.0)** — and the pipeline performs **no
unit conversion** (`scripts/common.py::normalize_maternal_risk` only renames and
re-codes the target). However the API contract and UI use **mg/dL** (`bloodSugar`,
API bounds 20–500) and **°C** (`bodyTemp`, bounds 35–42); frontend labels even
say “Blood Sugar (mg/dL)” and “Body Temperature (°C)”. Demonstrated with the real
model on one clinical scenario:
- entered in app units (BS 96 mg/dL, T 36.8 °C) → probability **0.8463, high**;
- same patient in the model's own units (BS 5.33 mmol/L, T 98.2 °F) → probability **0.0083, low**.
The ML API additionally **rejects UCI-unit values outright** (blood_sugar < 20,
body_temp > 42 → 422), so the model's own training distribution cannot even be
sent through the API. Additional scale inconsistencies: training `HeartRate` min
= 7 but schema min = 30; training `Age` max ≈ 70 (schema 10–100). Recommendation
(diagnosis required, not applied here): send/converted units matching the
trained feature space (or retrain on mg/dL/°C), update the schema bounds, and
document units in `docs/API.md`/UI labels.

**FINDING 2 — Behavioral note: missing “required” features are silently imputed,
not rejected.** Both services impute ANY missing value (including declared
required fields like `age`, `heart_rate`) to the saved training-median defaults
at inference time. Deterministic and honest (no fabricated score), but the
`required=True` semantic is effectively soft; if hard validation is desired it
should be enforced before `row_to_matrix`.

**FINDING 3 — Environment note (test harness, not product):** Node's `fetch` to
`http://localhost:8000` on this Windows host resolved to IPv6 `::1` while uvicorn
was bound to IPv4 `127.0.0.1`, making mlClient report *unavailable* in the live
e2e run until `ML_SERVICE_URL=http://127.0.0.1:8000` was set. Bind uvicorn to
`0.0.0.0` or pin the URL for local end-to-end runs.

**FINDING 4 — Non-blocking:** `body_temp` bounds differ between the ML schema
(35–42) and the shared validation (33–43); consider aligning. (Recorded; not
changed.)

**FINDING 5 — Documented behavior:** production `predict` returns the **top-10**
SHAP features by |value| for display; the full 13/6-feature SHAP is verified
independently and is additive to ~1e-7.

## 7. Final test counts

- ML pytest: **82/82** passed (2.15s)
- Backend vitest (checked-in suite): **41/41** passed, 7 files
- Frontend vitest: **24/24** passed, 5 files
- Typechecks: **PASS** (shared, backend, frontend)
- Production builds: **PASS** (shared, frontend, backend) with the warnings above
- Temporary verification suites (created for this report, then deleted):
  - Maternal Risk script checks: **17/17 PASS**
  - GDM script checks: **25/25 PASS**
  - Live end-to-end backend→ML (completed + persistence): **2/2 PASS**
  - Audit-log redaction: **1/1 PASS**
- Artifact hashes: **4/4 unchanged** (before == after)

## 8. Readiness for browser testing

- **Maternal Risk — NOT READY for browser testing.** The module itself works
  (loads, predicts, SHAP, honesty, MODEL_UNAVAILABLE all verified), but
  FINDING 1 (unit mismatch mg/dL/°C vs mmol/L/°F with no conversion) makes any
  browser-entered value clinically meaningless and even out of the model's
  distribution. Fix the unit contract first, then re-verify.
- **GDM — READY for browser testing (with caveats).** All ML-level checks pass,
  SHAP is real and 13-feature, exclusions (OGTT/Prediabetes/Case Number) and
  defaults are verified, live backend→ML integration completes and persists, and
  all suites are green. Caveats to keep in front of the user (already surfaced in
  the UI): Stage-2 glucose values are stored for record, never sent to the model;
  the 0.05 threshold yields recall 1.0 with false positives — screening, not
  diagnosis; dataset provenance is an unverified local research copy; and
  FINDING 2 (imputation of missing fields) applies.

No implementation changes were made during this phase; the only files created
were temporary test scripts/tests (now removed) and build outputs, plus
`docs/MATERNAL_GDM_TEST_REPORT.md`.