# MaaSuraksha — GDM Raw Dataset Audit

Source: `apps/ml-service/data/gdm/raw/dataset.xlsx` (single sheet **`GDM-Final2022`**)
Output: `apps/ml-service/data/gdm/raw/dataset.csv`

Status: **CONVERSION + AUDIT ONLY — NO TRAINING PERFORMED, DATASET CONTENTS UNCHANGED.**

> **Design follow-up:** the feature mapping, exclusions (`Case Number`, `OGTT`,
> `Prediabetes`) and missing-value strategy chosen on top of this audit are
> documented in **[`docs/GDM_MODEL_DESIGN.md`](GDM_MODEL_DESIGN.md)**. The
> loader implementing it is `apps/ml-service/scripts/common.py`.

## 0. Conversion method and integrity

- Converted with `pandas.read_excel(sheet_name=0, header=0)` → `to_csv(index=False)`.
- **No cleaning, imputation, renaming, or value fabrication was performed.** Column
  names and every cell value were taken from the workbook as-is (blank/empty Excel
  cells → empty CSV fields, i.e. NaN when parsed back).
- Round-trip verification: re-reading the CSV reproduces the exact rows, columns and
  values read from the workbook (`VALUES_IDENTICAL=True`, `COLUMNS_MATCH=True`).
- Original workbook preserved and unmodified: SHA-256 unchanged after conversion
  (`219DC849729D5D709289CE7BB3035F217B1B8380A2E9CEC76D3B48FACF50F3EC`).

## 1. Row count

- **3,525 data rows** (plus one header row).

## 2. Columns (17)

| # | Column | |
|---|---|---|
| 1 | Case Number | row identifier |
| 2 | Age | |
| 3 | No of Pregnancy | |
| 4 | Gestation in previous Pregnancy | |
| 5 | BMI | |
| 6 | HDL | |
| 7 | Family History | |
| 8 | unexplained prenetal loss | (sic, source spelling) |
| 9 | Large Child or Birth Default | |
| 10 | PCOS | |
| 11 | Sys BP | |
| 12 | Dia BP | |
| 13 | OGTT | |
| 14 | Hemoglobin | |
| 15 | Sedentary Lifestyle | |
| 16 | Prediabetes | |
| 17 | Class Label(GDM /Non GDM) | **target, 0/1** |

## 3. Data types (as parsed from CSV)

| Column | dtype |
|---|---|
| Case Number, Age, No of Pregnancy, Gestation in previous Pregnancy, Family History, unexplained prenetal loss, Large Child or Birth Default, PCOS, Dia BP, Sedentary Lifestyle, Prediabetes, Class Label | `int64` |
| BMI, HDL, Sys BP, OGTT, Hemoglobin | `float64` (non-integer because of missing values) |

All columns are numeric. No string/categorical dtype columns; binary attributes use 0/1 codes.

## 4. Missing values (4,300 missing cells total, 13.9% of all cells)

| Column | Missing | % of rows |
|---|---|---|
| Sys BP | 1,705 | 48.4% |
| BMI | 1,081 | 30.7% |
| HDL | 1,001 | 28.4% |
| OGTT | 513 | 14.6% |
| All other columns | 0 | 0.0% |

Target column has **no missing values**.

## 5. Unique categorical values

| Column | Unique values |
|---|---|
| No of Pregnancy | 1, 2, 3, 4 |
| Gestation in previous Pregnancy | 0, 1, 2 |
| Family History | 0, 1 |
| unexplained prenetal loss | 0, 1 |
| Large Child or Birth Default | 0, 1 |
| PCOS | 0, 1 |
| Sedentary Lifestyle | 0, 1 |
| Prediabetes | 0, 1 |

## 6. Target distribution

`Class Label(GDM /Non GDM)`: **0 = 2,153 (61.1%)**, **1 = 1,372 (38.9%)**. Imbalanced but both classes well represented.

## 7. Duplicate rows

- Exact full-row duplicates (all 17 columns): **0**.
- Duplicates ignoring `Case Number`: **4** (i.e., 4 rows share all other values with another row). `Case Number` itself is unique (3,525/3,525).

## 8. Possible target leakage

Strong leakage candidates flagged — the model must NOT be trained on these without a documented mapping decision:

| Column | abs. correlation with target | Note |
|---|---|---|
| **Prediabetes** | **0.7401** | **Equals the target in 3,082 / 3,525 rows (~87.4%)** — essentially a near-duplicate diagnostic label of the outcome. Top leakage risk. |
| PCOS | 0.6935 | High association |
| OGTT | 0.6899 | Diagnostic glucose test — very close to an outcome test |
| HDL | 0.6587 | |
| BMI | 0.6440 | |

`Prediabetes` (and likely `OGTT`) are suspect as outcome-associated diagnostic inputs and should be excluded or explicitly justified before any training.

## 9. Compatibility with the current MaaSuraksha GDM pipeline

**NOT compatible as-is. The current pipeline cannot consume this CSV without a rename/mapping step, which was out of scope (forbidden by this task).**

Current pipeline requires (`apps/ml-service/app/ml/tabular.py::GDM_FEATURES` + target `gdm` in `scripts/train_gdm.py`):

| Pipeline column | Present in CSV? | Comment |
|---|---|---|
| age | no | CSV has `Age` (different name) |
| bmi | no | CSV has `BMI` |
| fasting_glucose | no | missing; `OGTT` is not fasting glucose |
| postprandial_glucose | no | missing |
| hba1c | no | missing |
| gestational_week | no | missing; `Gestation in previous Pregnancy` ≠ gestational week |
| family_history_diabetes | no | CSV has `Family History` |
| previous_gdm | no | `No of Pregnancy` / `Gestation in previous Pregnancy` are not `previous_gdm` |
| gdm (target) | no | CSV target is `Class Label(GDM /Non GDM)` |

Findings:

- **0 of the 8 required feature columns and the 1 target column are present** under the expected snake_case names. The generic GDM loader would raise a missing-column error immediately.
- Even after a name-mapping exercise, three pipeline features have **no direct source** in this dataset: `fasting_glucose`, `hba1c`, `gestational_week`; `postprandial_glucose` would have no correct source either (only `OGTT` exists).
- Required-but-absent numeric features (`age`, `bmi`, ... currently mapped to `Age`, `BMI`) also contain heavy missing values (`BMI` 30.7% missing) that the MaaSuraksha preprocessing contract does **not** impute — the training loaders reject missing feature values.
- As a result, training `python scripts/train_gdm.py --dataset data/gdm/raw/dataset.csv` would fail validation, and **no GDM model should be trained on this dataset without an explicit, documented feature-mapping and leakage-handling plan**.

## 10. Confirmations

- CSV created by byte-faithful conversion; **no cell value was changed, cleaned, imputed, renamed, or fabricated**.
- Original `dataset.xlsx` **preserved** (SHA-256 unchanged).
- **No model training was performed.**
- **No dataset contents were modified** beyond the requested conversion (no cleaning applied to the CSV).
- Compatibility conclusion above is informational; no pipeline code or artifact was altered.