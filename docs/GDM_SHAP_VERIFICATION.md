# MaaSuraksha — GDM SHAP Verification (saved artifact)

Read-only SHAP verification of the **already-trained** GDM artifact via the
**production service path** (`GDMService.predict` → `row_to_matrix` →
`predict_proba` + `compute_shap_values`). No retraining, no modification of
`model.xgb` / `metadata.json` / raw data, no threshold change, no new model,
and **no fabricated SHAP values** — every value below was computed by
`shap.TreeExplainer` on the booster loaded from `artifacts/gdm/model.xgb`.

Verified artifact / metadata:

- `apps/ml-service/artifacts/gdm/model.xgb`
- `apps/ml-service/artifacts/gdm/metadata.json`

Verification script (read-only, OS temp dir):
`verify_gdm_shap.py` — production-path inference + full 13-feature SHAP.

---

## Hash integrity (before ⇄ after) — UNCHANGED

| File | SHA-256 BEFORE | SHA-256 AFTER | Status |
|------|----------------|---------------|--------|
| `model.xgb` | `9A4C97E192F7D95234A792DB7E14B13D9DA88AF274B03C2AB1480EDF5839D1F3` | same | unchanged |
| `metadata.json` | `BAE17447F71B25B3512BB8B8199037BAAECB5BF63EA44A99EDB02DE597F03124` | same | unchanged |

Hashes captured before any SHAP step and again after the full test suite;
both match. Nothing was modified.

## Model identity (recorded from metadata)

- `model_version` = **20260916T065854Z**
- `data_fingerprint` = **505844dbe785d0ef** (first 16 hex of the raw CSV
  SHA-256 — verified in the independent artifact QA).
- `thresholds.positive` = **0.05** (validation-selected F1-max — unchanged).
- Features = the approved **13** (exact list, order preserved).

## Two patient inputs with different model behavior

Both inputs are valid `GDMInput` objects (in-range, all 13 fields supplied).
The service returned three distinct behaviours overall:

| Case | Input highlights | probability | prediction / risk |
|------|------------------|-------------|-------------------|
| A (low-risk profile) | age 24, BMI 21.5, HDL 62, no PCOS, BP 110/70, fit | **0.005597** | **negative / low** |
| B (high-risk profile) | age 35, BMI 34, HDL 30, PCOS +, prior GDM-like history, BP 150/95, sedentary | **0.982167** | **positive / high** |
| B′ (perturbed B) | same as B but BMI 22, HDL 58, no PCOS, not sedentary | **0.612281** | **positive** (mid) |

These demonstrate clearly different model outputs (negative vs positive, and a
wide probability range 0.0056 → 0.612 → 0.982), so the model is not returning a
static result.

## Per-case verification results

### Case A — low-risk profile
- Production inference (`GDMService.predict`): `MODEL_AVAILABLE`, `negative`,
  `probability = 0.005597`, `risk_level = low`.
- 13-feature SHAP (log-odds space), top contributors:

| feature | SHAP (log-odds) |
|---------|----------------:|
| bmi | −1.795518 |
| diastolic_bp | −1.118758 |
| hdl | −0.423867 |
| previous_pregnancy_gestation | −0.400759 |
| pcos | −0.383998 |
| hemoglobin | −0.266994 |
| age | −0.170830 |
| family_history | −0.132569 |
| large_child_or_birth_defect | −0.046487 |
| unexplained_prenatal_loss | −0.024279 |
| pregnancy_count | +0.013752 |
| systolic_bp | +0.007483 |
| sedentary_lifestyle | +0.005240 |

- Sum of SHAP = **−4.737584**; base value = **−0.442339** → margin = −5.179923
  → sigmoid = **0.005597** = model probability (|diff| = 1.33e-8, PASS).

### Case B — high-risk profile
- Production inference: `MODEL_AVAILABLE`, `positive`, `probability =
  0.982167`, `risk_level = high`.
- 13-feature SHAP (log-odds space), top contributors:

| feature | SHAP (log-odds) |
|---------|----------------:|
| bmi | +1.608865 |
| diastolic_bp | +0.979694 |
| pcos | +0.713428 |
| previous_pregnancy_gestation | +0.592236 |
| hemoglobin | +0.582444 |
| hdl | −0.430484 |
| systolic_bp | +0.342065 |
| family_history | +0.232244 |
| unexplained_prenatal_loss | −0.096139 |
| sedentary_lifestyle | −0.044895 |
| pregnancy_count | −0.018534 |
| age | −0.016453 |
| large_child_or_birth_defect | +0.006569 |

- Sum of SHAP = **+4.451040**; base value = **−0.442339** → margin = +4.008701
  → sigmoid = **0.982167** = model probability (|diff| = 6.06e-8, PASS).

## Additivity check (model output space)

XGBoost binary outputs a **margin (log-odds)**; the class-1 probability is
`sigmoid(margin)`. SHAP is additive in this space:

`base_value + Σ SHAP = margin`, and `1/(1+exp(−margin)) == predict_proba(p1)`.

- Case A: base −0.442339 + (−4.737584) = −5.179923 → p = 0.005597 (exact to
  1.3e-8).
- Case B: base −0.442339 + (+4.451040) = +4.008701 → p = 0.982167 (exact to
  6.1e-8).

## SHAP feature-set checks

- SHAP **contains exactly the 13 approved features** (key set ==
  `metadata.features`, 13 unique keys) for both cases — PASS.
- **No `OGTT`, `Prediabetes`, or `Case Number`** appears anywhere in SHAP
  (checked on the full 13-key sets; production top-10 output also never
  contains them) — PASS.
- Production `predict` returns the top-10 SHAP by |value|; the production dict
  matches the independently-computed full 13-feature values **exactly**
  (rounded to 6 dp, equality to 1e-12) for both cases — confirming the single
  real computation path.

## SHAP differ appropriately between inputs

- Vectors differ as expected: max |ΔSHAP| = 3.404 between A and B.
- Directional consistency with the model (A→B): bmi −1.796 → +1.609
  (Δ +3.404), pcos −0.384 → +0.713, diastolic_bp −1.119 → +0.980,
  previous_pregnancy_gestation −0.401 → +0.592; hdl stays negatively
  contributing in both. Movements align with the probability increase
  0.0056 → 0.9822. — PASS.

## SHAP generated from the saved artifact, not hardcoded

- A perturbation (B′ = B with BMI 22, HDL 58, no PCOS, not sedentary) run
  through the **same loaded booster** changes both the model output
  (probability 0.982 → 0.612) and every affected SHAP value (e.g., bmi
  +1.609 → −1.113, pcos +0.713 → −0.222, hdl −0.430 → −1.024). Total SHAP
  movement >> 1e-3 — PASS.
- Values are produced by `shap.TreeExplainer` on the booster returned by the
  production `_load()` path; there is no lookup table or hardcoded set, and
  `compute_shap_values` returns `None` on any failure rather than fabricating
  numbers.

## Complete ML test suite

`pytest -q` in `apps/ml-service`: **82/82 passed**, exit code 0 — including
`tests/test_shap.py` (SHAP present, grounded in model features, and
input-sensitive, i.e., not static). Tests run under temp artifact dirs; the
real GDM artifact is untouched.

---

## Report structure: what these numbers mean

- **Model prediction** — `probability` (0.005597 / 0.982167 / 0.612281) and the
  associated risk class (`negative`/`positive` at threshold 0.05) are the
  **model's own output**. They are a *screening* risk estimate.
- **SHAP feature contribution** — each `feature: SHAP` value is an **attribution
  in log-odds space**: how much that feature's value pushed the model's margin
  away from the base rate (−0.442339 ≈ 39% baseline) toward positive or
  negative. e.g., BMI +1.609 in Case B is the single largest contributor to the
  positive margin; HDL −0.430 is a protective-direction contribution that is
  still outweighed by the risk drivers.
- **Clinical interpretation** — SHAP explains *what the model used*, not why the
  patient has GDM. **SHAP does not prove causality and does not constitute a
  diagnosis.** A `positive` result only indicates referral for Stage 2 glucose
  testing / clinician interpretation.

## Clean al statements

1. SHAP verifies the saved artifact explains its own predictions consistently
   (additive to 1e-7, exact 13-feature key set, no excluded columns).
2. **No leakage via SHAP:** OGTT / Prediabetes / Case Number are out of the
   feature set and out of every SHAP output.
3. **No fabrication:** all values recomputed from the saved booster on the
   production path; perturbations move outputs and SHAP together; the 82-test
   suite passes.
4. SHAP is not a causal or diagnostic result — the earlier artifact-QA
   caveats (unverified dataset provenance, imputed missingness, near-duplicate
   rows, recall = 1.0 at the low screening threshold) remain and require
   external validation before any clinical use.

Verification complete; stopping as instructed.