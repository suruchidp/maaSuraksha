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
| Maternal mortality risk | `maternal_risk` | `risk` (0/1) | age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate, bmi, gestational_week, hemoglobin | Tabular (XGBoost) |
| GDM detection | `gdm` | `gdm` (0/1) | age, bmi, fasting_glucose, postprandial_glucose, hba1c, gestational_week, family_history_diabetes, previous_gdm | Tabular (XGBoost) |
| PPD screening | `ppd` | `label` (none/mild/moderate/severe) | free text (patient narrative) | NLP (DistilBERT) |
| Mood monitoring | `mood` | `label` (negative/neutral/positive) | free text (journal entry) + rule-based safety | NLP (DistilBERT) |

## Candidate sources (licensing to be confirmed before use)

The following are real, externally documented sources commonly used for these
tasks. The team must obtain them lawfully, confirm the license permits use
(and any consent/anonymisation requirements), and record provenance + a data
fingerprint.

### 1. Maternal Health Risk
- **Maternal Health Risk Data Set (UCI)** — `age`, `SystolicBP`, `DiastolicBP`,
  `BS` (blood sugar), `BodyTemp`, `HeartRate`, `RiskLevel` (low/mid/high).
  Aggregated free dataset on Kaggle (double-check license; widely used for
  academic demonstration). Map `RiskLevel` to binary `risk` (high → 1).
  Requires additional features (bmi, gestational_week, hemoglobin) —
  derive or collect; missing optional columns are imputed at train time only
  for optional features, otherwise the column must be provided.

### 2. GDM
- **PIMA Indians Diabetes** (incl. `bmi`, `glucose`, `diabetes pedigree`) —
  public, commonly redistributed; not GDM-specific and lacks
  `gestational_week`/`previous_gdm`, so suitability is limited (documented
  limitation). Prefer a GDM-specific cohort dataset (e.g., hospital GDM
  screening data) if available.

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
- Text: tokenized with the base tokenizer (`distilbert-base-uncased`),
  truncation at 256 tokens (PPD) / 256 (mood). No augmentation.
- Split: stratified train / validation / test (0.70 / 0.15 / 0.15), fixed seed.

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