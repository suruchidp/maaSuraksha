# MaaSuraksha — Phase 5 Report: Full Frontend Application

Status: **COMPLETE** — all role apps implemented, trilingual i18n shipped, real backend/ML wiring verified, full test + build chain green.

## 1. Objective & Scope

Deliver the complete user-facing application: PATIENT, ASHA, DOCTOR, and ADMIN web apps on a single React SPA, with role-based routing, an end-to-end trilingual (English / Kannada / Hindi) experience, real API integration against the Phase 3/4 backend and ML service, honest ML-result rendering, and a verified quality bar (typecheck, unit tests, production build).

Out of scope (carried to Phase 6): browser E2E tests, deployment hardening, and PWA/mobile packaging.

## 2. Architecture & Structure

- **Framework:** React 18 + Vite 6 + TypeScript strict mode; Tailwind CSS.
- **Routing:** `ProtectedRoute` with `allowedRoles` guards session + role; role apps nested under the shared `AppLayout` (top nav + role menu). Routes:
  - Public: `/`, `/login`, `/register`, `/unauthorized`, `*` → NotFound.
  - `/patient/*` (14 pages), `/asha/*` + `/asha/patients/:patientId`, `/doctor/*` + `/doctor/patients/:patientId`, `/admin/*` (4 pages).
- **State:** Zustand stores — `authStore` (login/logout, persistence), `languageStore`, `toastStore`. React Query hooks in `hooks/queries.ts` wrap all server calls.
- **Data layer:** 16 typed API service modules (`services/*`) speaking the backend envelope (`{success,data,meta}` / `{success:false,error:{code,message}}`); `lib/api.ts` centralizes auth headers, error normalization, and pagination params. Shared DTO types re-exported through `lib/types.ts` + `lib/mapping.ts`.
- **UI:** 18 reusable headless-ish primitives in `components/ui` (Button, DataTable, Modal, ConfirmDialog, Field/Input/Select/Textarea, Badge, Tabs, Toaster, Spinner, EmptyState, ErrorState, StatCard, PageHeader, Checkbox, Card); role-aware components (`caregiver/ASHAForms`, `caregiver/DoctorForms`, `caregiver/PatientOverview`, `ml/*`) render per-role bodies for the same data.
- **Legacy cleanup:** removed the earlier temporary `utils/api.ts` and `pages/DashboardPage.tsx`; all flows now use the real services/queries path.

## 3. Role Applications

- **Patient (14 pages):** Dashboard, Assessments (maternal risk / GDM / PPD), HealthMetrics, Symptoms, DietPlans, Recommendations, Alerts, Appointments, Referrals, Pregnancy tracking, MoodJournal, Education, Chatbot, Reports. Includes tabbed AssessmentPanels for self-screening, trend charts, and status-labeled lists.
- **ASHA:** Dashboard (outreach stats), patient list with search/pagination, per-patient detail with overview, records capture (`ASHAForms`), referrals and follow-up actions.
- **Doctor:** Dashboard, patient list, per-patient detail with clinical history and results, orders/referrals (`DoctorForms`), assessment results review.
- **Admin:** Dashboard (aggregate stats), user management (roles/active), education-content CRUD, audit-log viewer.

## 4. ML Integration & Honesty

Reproduction/data-integrity rules established in Phase 4 are enforced in the UI:

- Assessments respect `status = pending | completed | unavailable` and render `message`, `modelVersion`, `shapValues`, and `recommendations` only when present; `ModelStatusBanner` surfaces `MODEL_UNAVAILABLE` states instead of fabricated scores.
- PPD renders `severity` and `edinburghScore` (never a riskLevel); Mood shows `sentiment` + ratings only after `analyzed`.
- `ShapChart` plots wire `Record<string,float>` SHAP contributions; anything absent is shown as unavailable, never invented.
- `AssessmentResult` displays raw wire values as-is (e.g. lowercase `high`) with translated labels; the wiring is covered by unit tests (AssessmentResult, ModelStatusBanner).

No risk/SHAP value is ever rendered when the model is unavailable or the field is null.

## 5. Internationalization

- **Locales:** `apps/frontend/src/i18n/locales/{en,hi,kn}.json` — **582 flat keys each**, all three verified for parity and against every `t()` call by `C:\Users\psuru\AppData\Local\Temp\opencode\check-i18n.js` (remaining hits are false positives from `import()` strings and multiline literals).
- **Switch:** `LanguageSwitcher` persists via i18next LanguageDetector (cache key `i18nextLng`); `i18n/index.ts` pins `supportedLngs`, `load:"languageOnly"`, `useSuspense:false`, and syncs `document.documentElement.lang` on change.
- **Validation:** `lib/schemas.ts` field messages resolve labels through the `fields.*` namespace with the injected `t`, so errors appear in the active language; `InputDate` typed against `UseFormRegister` for cancellation-proof symptom forms.
- **Titles:** LoginPage keeps `document.title` in sync via an effect keyed on `[t, i18n.language]`.

## 6. Forms & Validation

Client-side forms (screening inputs, records, education CRUD, user management) use the shared schema helpers (`lib/schemas.ts`: required, numeric ranges, `num()` label injection) feeding Formik-style field components. Server 422s and envelope errors are normalized in `lib/api.ts` and surfaced through toasts/inline errors; list views share `lib/listParams.ts` pagination (page/limit) matching the backend contract (max limit 100, meta counts).

## 7. Testing & Verification (all green)

| Check | Command | Result |
|---|---|---|
| Frontend unit tests | `npm test --workspace=apps/frontend` | 24 passed / 5 files (ProtectedRoute, LanguageSwitcher, AssessmentResult, ModelStatusBanner, schemas) |
| Backend tests | `npm test --workspace=apps/backend` | 41 passed / 7 files |
| ML service | `npm test --workspace=apps/ml-service` | 56 passed (pytest via temp venv) |
| Root typecheck | `npm run typecheck` | green (all workspaces, strict TS) |
| Root build | `npm run build` | shared + frontend (`tsc -b && vite build`) + backend (tsc) green |

### ML-Service fixes landed this session (3 previously-failing tests)

1. `GET /health` 404 → added `/health` route to `app/routers/health.py` (root alias preserved) returning `{status, service, version, models}` for all four models.
2. `compute_defaults` `IndexError` on single-column input → now computes one median per **provided** column, attributing each to the feature at that column index in the category's feature order (`app/ml/tabular.py`).
3. SHAP values identical across differing inputs → toy fixture in `tests/conftest.py` now trains the synthetic XGBoost on **clinical-scale ranges** (per-feature plausible min/max), so realistically varied inputs (e.g. systolic 120 vs 190) land in distinct model regions and produce genuinely different SHAP.
4. Earlier this phase: backend `patients.test.ts` harded to seed admins via login (mirrors rbac pattern); frontend strict-TS errors fixed (child `lang: Language` typing, removed impossible `status === "pending"` compare, removed dead `riskScore` expression).

Env notes: ML tests require `ML_VENV_PYTHON` pointing at the shared temp venv (`C:\Users\psuru\AppData\Local\Temp\opencode\maasuraksha-ml-venv\Scripts\python.exe`); repo-local native installs remain blocked by the machine WDAC policy, so the venv lives outside the repo.

## 8. Outcomes, Known Limitations, Next Steps

**Outcomes:** Four role apps fully wired to real APIs; trilingual UI complete and tested; ML results rendered honestly with model-status fallbacks; verification chain fully green (24 + 41 + 56 tests, strict typecheck, production build).

**Known limitations / follow-ups:**
- Vite build emits two benign warnings: the `education.ts` dynamic+static import (module cannot be code-split) and a 1.15 MB main chunk (~324 kB gzip). Candidate for `manualChunks`/lazy-route split later; `chunkSizeWarningLimit` could also be raised.
- No end-to-end browser tests yet.
- `ML_VENV_PYTHON` must be set in the shell before `npm test` for the ml-service workspace (root `npm test` otherwise reports the documented interpreter-missing message).

**Next steps:** Phase 6 — browser E2E smoke flows (login → screen to result) across roles, deployment/packaging polish, and optionally chunk-optimization of the bundle.