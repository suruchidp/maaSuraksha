# MaaSuraksha — Dataset Plan

This document is the **required-datasets plan**. No dataset is committed to
this repository, and none is assumed present. Until a dataset listed here is
obtained (with suitable licensing), placed in `apps/ml-service/data/<category>/raw/`
and used by a training script, the corresponding ML model stays
`MODEL_UNAVAILABLE` and the API will not fabricate predictions.

## Honesty guarantee

- Inference endpoints return `MODEL_UNAVAILABLE` unless a real trained artifact
  (model + metadata from a real run) exists.
- No accuracy / probability / SHAP value is ever hard-coded or invented.
- Metrics in `metadata.json` come only from held-out evaluation splits.

## Datasets required

| Task | Category | Target variable | Features | Type |
|------|----------|-----------------|----------|------|
| Maternal mortality risk | `maternal_risk` | `risk` (binary: 0 = low/moderate, 1 = high) | age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate | Tabular (XGBoost) |
| GDM early-risk assessment | `gdm` | `gdm` (0/1) | age, bmi, hdl, pregnancy_count, previous_pregnancy_gestation, family_history, unexplained_prenatal_loss, large_child_or_birth_defect, pcos, systolic_bp, diastolic_bp, hemoglobin, sedentary_lifestyle | Tabular (XGBoost) |
| PPD screening | `ppd` | `label` (none/mild/moderate/severe) | free text (patient narrative) | NLP (DistilBERT) |
| Mood monitoring | `mood` | `label` (negative/neutral/positive) | free text (journal entry) + rule-based safety | NLP (DistilBERT) |

## Candidate sources (licensing to be confirmed before use)

The following are real, externally documented sources commonly used for these
tasks. The team must obtain them lawfully, confirm the license permits use
(and any consent/anonymisation requirements), and record provenance + a data
fingerprint.

### 1. Maternal Health Risk (selected: UCI)

- **Dataset:** Maternal Health Risk
- **Source:** UCI Machine Learning Repository
- **URL:** https://archive.ics.uci.edu/dataset/863/maternal+health+risk
- **DOI:** 10.24432/C5DP5D
- **License:** CC BY 4.0
- **Records:** 1,013

**Original predictors:** `Age`, `SystolicBP`, `DiastolicBP`, `BS` (blood
sugar), `BodyTemp`, `HeartRate`.

**Original target:** `RiskLevel` = `low risk` / `mid risk` / `high risk`
(three classes).

**MaaSuraksha transformation:**
```
low risk + mid risk -> 0
high risk           -> 1
```
MaaSuraksha target `risk` is binary `0 = low/moderate risk`, `1 = high risk`.
This binary target is **not** the original three-class UCI `RiskLevel` and is
documented as such in the model metadata.

**MaaSuraksha model features:**
```
age
systolic_bp
diastolic_bp
blood_sugar
body_temp
heart_rate
```

**Explicit scope note:** BMI, gestational week and hemoglobin are **NOT**
training features of this model because they are not present in the selected
UCI dataset. They remain part of MaaSuraksha patient records, the `HealthMetric`
model, `PregnancyProfile`, API DTOs and frontend forms, but the trained Maternal
Risk model uses only the six predictors above and never receives the others.

The training script accepts the raw UCI download and maps column names
(`Age → age`, `SystolicBP → systolic_bp`, `DiastolicBP → diastolic_bp`,
`BS → blood_sugar`, `BodyTemp → body_temp`, `HeartRate → heart_rate`,
`RiskLevel → risk`) and the target labels automatically.

### 2. GDM

**Selected dataset:** a GDM-specific cohort sourced directly from the project
copy at `apps/ml-service/data/gdm/raw/dataset.xlsx` (single sheet
`GDM-Final2022`, mirrored to `dataset.csv`). **3,525 records**; target
`Class Label(GDM /Non GDM)`: **0 = Non GDM (2,153)**, **1 = GDM (1,372)**.
The exact external origin and license are **unverified** and recorded as such —
the dataset is not publicly cited. See `docs/GDM_DATASET_AUDIT.md`.

**Two-stage maternal-care workflow:**
- **Stage 1** — community/home **early GDM risk assessment / decision support**
  (this is what the ML model does), using only variables available **before**
  diagnostic glucose testing.
- **Stage 2** — clinical glucose testing (OGTT etc.) and clinician diagnosis,
  stored in the health record but **never sent to the model**.

**MaaSuraksha model features (13, all early-risk / pre-glucose-testing):**
```
age, bmi, hdl, pregnancy_count, previous_pregnancy_gestation, family_history,
unexplained_prenatal_loss, large_child_or_birth_defect, pcos, systolic_bp,
diastolic_bp, hemoglobin, sedentary_lifestyle
```

**Excluded from the model** (the raw file keeps them untouched):
- `Case Number` — identifier only; never a predictive feature.
- `OGTT` — a diagnostic glucose test (Stage 2 clinical measurement), not an
  early-risk feature.
- `Prediabetes` — leakage concern: equals the target in ~87% of rows; excluded
  until its meaning/timing is established.

**Missing values:** medians fitted on the **training split only** (see
`app/ml/tabular.py::defaults_from_frame`), used to fill train/val/test during
training and serialized as inference `defaults`. No rows are deleted and no
clinical value is fabricated, imputed at load time or remapped to a different
column.

The training script maps the display names automatically
(`scripts/common.py::GDM_CSV_COLUMN_MAP`). Full design:
`docs/GDM_MODEL_DESIGN.md`.

### 3. PPD
- **DAIC-WOZ** (depression interviews, consent-based research use) — not
  PPD-specific; English.
- Open **text datasets of postpartum mental-health content** (e.g., r/beyondthebump
  / r/postpartumdepression corpora collected by researchers) with severity
  labels by clinicians. Licensing varies.

### 4. Mood
- **Emotion/sentiment text datasets** (e.g., GoEmotions, SemEval sentiment) —
  general domain; **not** pregnancy-specific. Fine for prototype monitoring,
  documented limitation: domain shift.
- Custom label set: negative / neutral / positive.

## Preprocessing (documented, reproducible)

- Tabular: median imputation from the **training split only**; bool columns
  coerced to 0/1; values validated against clinically sensible ranges.
- **Maternal risk:** the six UCI predictors are always required and complete.
  Missing values in the six features are **rejected** (never imputed) and no
  synthetic clinical values are created. The final model receives exactly
  `age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate`.
- **GDM:** the 13 early-risk features are mapped from the `GDM-Final2022` sheet
  by `scripts/common.py::load_gdm_early_risk_dataset`; missing feature values
  are preserved and imputed with train-split-fitted medians
  (`defaults_from_frame`). `OGTT`, `Prediabetes` and `Case Number` never become
  model features.
- Text: tokenized with the base tokenizer (`distilbert-base-uncased`),
  truncation at 256 tokens (PPD) / 256 (mood). No augmentation.
- Split: stratified train / validation / test (0.70 / 0.15 / 0.15), fixed seed.

## Laptop-safe training

- XGBoost thread usage is bounded via `MAASURAKSHA_ML_THREADS` (default `2`,
  clamped to the machine's CPU count), suitable for a 16 GB CPU-only laptop.
- No GPU, no parallel training jobs, no multi-model concurrency. Early stopping
  on validation is preserved.

## Evaluation

- Tabular: accuracy, precision, recall, F1, ROC-AUC, PR-AUC computed on the
  **test split**; decision threshold optimised on the **validation split**
  (F1-max). Values are written to `metadata.json`, never hard-coded.
- NLP: accuracy + macro-F1 on the test split + per-class classification report.

## Limitations (documented)

- All candidate datasets are research/demonstration grade; none is a proper,
  clinically validated, locally-populated cohort. Clinical deployment requires
  IRB-approved, consented, locally representative data and external validation.
- Language coverage (hi/kn) for PPD/mood models is only as good as the training
  data; the serving layer currently defaults English text handling.
- Models are decision-support only; never a substitute for clinical judgement.

## Suitability checklist before training

1. License allows use in this (research) context. ⬜
2. Data is fully anonymised / de-identified. ⬜
3. Provenance + readme recorded in `data/<category>/raw/`. ⬜
4. Fingerprint recorded in `metadata.json` after training. ⬜
5. Held-out evaluation meets the team's minimum quality bar. ⬜