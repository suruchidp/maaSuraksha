# MaaSuraksha — GDM Artifact Independent Quality Verification

Scope: independent, read-only QA of the **already-trained** GDM artifact.
No retraining, no modification of `model.xgb` / `metadata.json` / raw XLSX/CSV,
no threshold tuning, no metric optimization, no second model, **no SHAP**
(verification used the saved booster + `predict_proba` only).

Verified artifacts/dataset:

- `apps/ml-service/artifacts/gdm/model.xgb`
- `apps/ml-service/artifacts/gdm/metadata.json`
- `apps/ml-service/data/gdm/raw/dataset.csv`

Verification scripts (read-only, in OS temp dir, now unused):
`verify_gdm_qa.py`, `gdm_gain_importance.py`.

---

## Hash integrity (item 1) — UNCHANGED

| File | SHA-256 BEFORE | SHA-256 AFTER | Status |
|------|----------------|---------------|--------|
| `model.xgb` | `9A4C97E192F7D95234A792DB7E14B13D9DA88AF274B03C2AB1480EDF5839D1F3` | same | unchanged |
| `metadata.json` | `BAE17447F71B25B3512BB8B8199037BAAECB5BF63EA44A99EDB02DE597F03124` | same | unchanged |
| `data/gdm/raw/dataset.csv` | `505844DBE785D0EF41D0BFF9D9A56746A1A88B3B576DE6F856133D3815F90933` | same | unchanged |

Hashes were captured before any verification step and again after the full test
suite; all three match. Verification made zero modifications.

## 2. Dataset fingerprint — PASS

`metadata.data_fingerprint = 505844dbe785d0ef` equals the first 16 hex
characters of the SHA-256 of the raw CSV (`505844DBE785D0EF…`). The metadata
fingerprint is the 16-char **truncated** hash (project convention —
`common.dataset_fingerprint`), and the full CSV hash verifies against it.

## 3. Load through the real inference service — PASS

`GDMService()._load()` (production path) loads `model.xgb` + `metadata.json`:
`service.model_version = 20260916T065854Z`, consistent with `metadata.version`.

## 4. Saved feature list == approved 13 — PASS

`metadata.features` is exactly, in order:
`age, bmi, hdl, pregnancy_count, previous_pregnancy_gestation, family_history,
unexplained_prenatal_loss, large_child_or_birth_defect, pcos, systolic_bp,
diastolic_bp, hemoglobin, sedentary_lifestyle` — equal to both the approved
design list and `tabular.feature_names("gdm")`. 13 unique names.

## 5. Case Number / OGTT / Prediabetes cannot enter the model matrix — PASS

- None of them appear in `metadata.features`.
- `GDMInput(**payload, ogtt=95, prediabetes=1, **{"Case Number": 1})` parses with
  the three extras ignored; `row_to_matrix` still emits a `(1, 13)` matrix and
  `names == features`. The loader log also confirms the exclusion of the three
  non-feature columns before matrix construction.

## 6. Preprocessing defaults == train-split medians — PASS

For all 13 features, `metadata.defaults[name]` equals the median of the
**training-split** finite values (recomputed independently, seed-42 split) to
within 1e-6 (the 6-decimal rounding used when metadata was written). Examples:
bmi 27.5, hdl 49.0, systolic_bp 132.0, hemoglobin 14.0, age 32.0.
Imputation is fitted on train only — no validation/test leakage through the
defaults.

## 7–8. Independent test-metrics reconstruction — PASS (exact match)

Test-set predictions rebuilt from the saved artifact at the saved threshold
`0.05`; confusion matrix rows=true (Non-GDM, GDM), cols=predicted:

```
              Predicted
               Non GDM  GDM
True Non GDM     303     20
     GDM           0    206
```

TN=303, FP=20, FN=0, TP=206.

| Metric | `metadata.metrics.test` | Recomputed | Match |
|--------|------------------------|------------|-------|
| accuracy | 0.962193 | 0.962193 | PASS |
| precision | 0.911504 | 0.911504 | PASS |
| recall | 1.000000 | 1.000000 | PASS |
| f1 | 0.953704 | 0.953704 | PASS |
| roc_auc | 0.997550 | 0.997550 | PASS |
| pr_auc | 0.996251 | 0.996251 | PASS |

All recomputed values equal the saved metadata to 1e-9 (bit-reproducible:
deterministic split, saved booster, saved defaults).

## 9. Threshold provenance — PASS

Saved `thresholds.positive = 0.05`. Re-deriving the F1-max sweep
(`common.best_threshold`, `linspace(0.05, 0.95, 91)`) on the **validation**
split only returns exactly `0.05` (validation F1 at 0.05 = 0.96037). Selection
consumes only validation scores; the test split is never used for threshold
selection — test metrics are computed afterwards as a reporting step. The
0.05 result is the lower bin edge (a boundary optimum given monotone F1 at low
thresholds), consistent with a sensitive screening design.

## 10–12. Leakage / data-quality inspection (read-only, nothing altered)

### Per-feature statistics (full dataset)

| feature | min | max | corr(target) | univariate AUC | missing | unique |
|---------|-----|-----|-------------:|---------------:|--------:|-------:|
| pcos | 0 | 1 | +0.69 | 0.8138 | 0 | 2 |
| bmi | 13.3 | 45.0 | +0.64 | 0.9252 | 1081 (31%) | 272 |
| diastolic_bp | 60 | 124 | +0.58 | 0.8777 | 0 | 65 |
| systolic_bp | 90 | 185 | +0.50 | 0.8247 | 1705 (48%) | 96 |
| previous_pregnancy_gestation | 0 | 2 | +0.48 | 0.7602 | 0 | 3 |
| hemoglobin | 8.8 | 18.0 | +0.48 | 0.7668 | 0 | 88 |
| age | 20 | 45 | +0.45 | 0.7586 | 0 | 26 |
| large_child_or_birth_defect | 0 | 1 | +0.35 | 0.6708 | 0 | 2 |
| family_history | 0 | 1 | +0.35 | 0.6769 | 0 | 2 |
| unexplained_prenatal_loss | 0 | 1 | +0.22 | 0.6107 | 0 | 2 |
| pregnancy_count | 1 | 4 | +0.21 | 0.6038 | 0 | 4 |
| sedentary_lifestyle | 0 | 1 | +0.14 | 0.5705 | 0 | 2 |
| hdl | 15 | 70 | −0.66 | 0.1126 (inverse) | 1001 (28%) | 56 |

### Identifier / copy-of-target / post-outcome checks

- **Identifier:** `Case Number` is a unique row index (3,525 unique / 3,525
  rows) and is never a model feature. **No identifier in the model.**
- **Copy of target:** no numeric feature equals the target. 0/1 booleans
  occasionally coincide with the label by pure correlation (max = pcos 85%);
  strongest single-feature class separation is continuous bmi (AUC 0.925),
  not a 0/1 column that "is" the label.
- **Post-outcome variable:** `large_child_or_birth_defect` /
  `unexplained_prenatal_loss` relate to *previous* pregnancies, i.e., they are
  known before the current pregnancy's glucose screen (standard GDM history
  covariates) — not post-outcome for the current decision point. Not leakage.
- **Excluded leakage column:** `Prediabetes = target` in 87.4% of rows and is
  **excluded from the model** (confirmed, item 5). `OGTT` (diagnostic, 513
  missing) is likewise excluded.

### Why the metrics are so high — technically consistent

The saved booster's own gain importances:

| feature | gain share |
|---------|-----------:|
| bmi | 35.4% |
| pcos | 16.8% |
| diastolic_bp | 13.0% |
| previous_pregnancy_gestation | 11.0% |
| hemoglobin | 6.1% |
| sedentary_lifestyle | 3.8% |
| systolic_bp | 3.3% |
| hdl | 3.1% |
| all remaining | <3% each |

Four features are individually very separable (univariate AUC ≥ 0.81: bmi
0.925, diastolic_bp 0.878, systolic_bp 0.825, pcos 0.814; hdl strongly
informative inversely). A gradient-boosted ensemble combining them reaches
~0.998 AUC **without** any target-copy column in the feature set. The
recomputed metrics match the saved metadata exactly (bit-for-bit), so the high
ROC-AUC / PR-AUC are **reproducible from the saved artifact and the saved
defaults** and are not a bookkeeping artifact. The only `Pre=F1-max` "perfect"
value is **recall = 1.0 on val and test**, which is the expected behaviour of a
low, sensitive screening threshold (0.05) on a highly separable cohort — real,
and reported honestly with its 20 FP cost.

## 13. Split reproducibility & disjointness — PASS

Reproducing `common.stratified_split(df, "gdm", seed=42)` gives train 2,467
(1507/960), val 529 (323/206), test 529 (323/206) — matching the metadata and
the training report. Index intersections: train∩val = 0, train∩test = 0,
val∩test = 0. Deterministic and disjoint.

## 14. Case Number uniqueness across splits — PASS

`Case Number` is unique for all 3,525 rows and no Case Number appears in more
than one partition (all pairwise intersections = 0).

## 15. Complete ML test suite — PASS

`pytest -q` in `apps/ml-service`: **82/82 tests passed**, exit code 0
(tests run under temp artifact/data dirs; the real artifact is not touched).

---

## Results summary

| Item | Result |
|------|--------|
| 1 hashes unchanged (before vs after) | PASS |
| 2 fingerprint == dataset | PASS |
| 3 loads via GDMService | PASS |
| 4 exactly 13 approved features | PASS |
| 5 Case Number / OGTT / Prediabetes excluded from matrix | PASS |
| 6 defaults == train-split medians | PASS |
| 7–8 recomputed test metrics == saved metadata | PASS (exact) |
| 9 threshold 0.05 = validation F1-max, test unused | PASS |
| 10–12 leakage/data-quality inspection | PASS (concerns below) |
| 13 seed-42 split reproducible, disjoint | PASS |
| 14 no Case Number across splits | PASS |
| 15 full ML test suite | PASS (82/82) |

## Concerns (no blocking defects found)

1. **Unverified provenance / license** (pre-existing, documented): the dataset
   is a locally supplied historical research cohort with unconfirmed external
   origin; not clinically validated. Deployment outside research requires
   IRB-approved, consented, locally representative data.
2. **Heavy missingness in key continuous features:** bmi 31%, systolic_bp 48%,
   hdl 28% — imputed with train-split medians. Consistent and leak-free, but
   the missingness itself (and its association with the outcome) deserves
   documentation before any clinical use.
3. **Near-duplicate questionnaire rows:** 8 rows are exact duplicates of
   another row **ignoring Case Number**; 7 fell in train, 1 in validation,
   0 in test. This can mildly flatter validation metrics but does **not**
   inflate the reported test metrics (test contains none of those rows), and the
   rows are distinct patients, not repeated rows of the same patient.
4. **Cohort cleanliness:** value ranges look unusually tidy (age 20–45,
   pregnancy_count 1–4, gestation_prev 0–2, every feature 0/1 or small-integer)
   and separation is unusually strong — consistent with a curated/simulated
   research cohort. This argues for external validation before deploying.
5. **recall = 1.0000** is boundary-effect at `positive = 0.05` (F1-max on
   validation); honest and intentional for a screening tool, but the 20 false
   positives on test should be expected in use.

## Verdict

The high ROC-AUC/PR-AUC are **technically consistent with the saved artifact**:
metrics reproduce bit-for-bit from `model.xgb` + `metadata.json` + the raw CSV,
the features driving them (bmi, pcos, BP, hdl) are genuinely and strongly
separable, and the classic leakage columns (Prediabetes, OGTT, Case Number) are
provably excluded from the model matrix. **No target-copy, identifier, or
post-outcome variable remains in the model, and no cross-split overlap exists.**
Remaining concerns are **data-provenance/quality concerns, not artifact
leakage**: unverified external source, high feature missingness, near-duplicate
rows, and a very clean/synthetic-looking cohort that warrants external
validation before any clinical deployment.

Final test-suite result: **pytest 82/82 passed**. No files were modified
(hashes before == hashes after for model.xgb, metadata.json, and dataset.csv).
Verification complete; stopping as instructed.