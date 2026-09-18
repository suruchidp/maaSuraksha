# Pregnancy Tracking

Open `/patient/pregnancy` (Pregnancy Profile in the sidebar). Assigned doctors and ASHA workers can use the same tracker on a patient detail page.

## Dating and profile

Gestational age is calculated on every read from the LMP calendar date and today's India calendar date, as completed weeks plus days. EDD is LMP plus 280 days; trimester boundaries are 14 and 28 completed weeks. Existing stored week/trimester fields no longer drive current guidance. Dating beyond 42 weeks is displayed honestly and flagged for review instead of capped. Future or invalid LMP input is rejected.

Profile updates preserve omitted medical history and risk factors. Gravida/para must be whole numbers with para below gravida. Concurrent edits return 409. Completing a pregnancy requires a valid end date and freezes age at that date; reopening makes dating live again. Changing LMP resets recorded milestones. This is a current-profile tracker, not a multiple-pregnancy archive or clinician-confirmed ultrasound dating system. EDD remains an estimate without a clinician override.

## Milestones and connected care

The fixed milestone catalog provides antenatal care, ultrasound discussion, GDM screening and birth/contact planning windows, with primary guidance links. Completion is explicitly recorded with server time and author; a passed window is never assumed complete. Complete/undo requires the profile's latest `updatedAt`. Completed pregnancies have no milestone actions or pregnancy-specific reminders.

The alert engine uses live dating and deduplicates reminders by profile/LMP cycle. Completing a milestone resolves its engine reminder; undo can reopen an engine-resolved reminder while preserving manually resolved alerts. Diet and education personalization use live dating. The maternal risk form seeds a supported current week, preserves manual edits, and leaves unknown/out-of-range dating blank.

The tracker includes current-pregnancy health readings, latest maternal/GDM assessment status, latest symptom, next appointments in IST and open alert count. It returns at most the latest 100 readings, displays included/total counts, and plots missing values as gaps. No assessment means no invented risk score. Appointment availability remains independent of pregnancy completion.

## API and authorization

All routes require authentication. Patients access self; doctors/ASHA access currently assigned patients; admins retain existing patient access. Invalid patient IDs, stale updates and revoked assignments are checked server-side.

- Existing `GET`/`POST`/`PUT /api/v1/pregnancy` retain profile compatibility and now return live dating fields.
- `GET /api/v1/pregnancy/tracking?userId=...` returns profile, milestones, bounded readings and connected care.
- `PATCH /api/v1/pregnancy/milestones/:key?userId=...` takes `{ completed: boolean, updatedAt: string }`.

No migration is required; new status and milestone fields have defaults. The main workflow is available in English, Hindi and Kannada; some clinical descriptions retain English wording.

## Verification

All 124 backend regression tests passed, including pregnancy calendar boundaries, live dating, history preservation, completion/reset, reminder deduplication, stale writes, metric bounds, patient isolation and assignment revocation. The frontend regression suite passed 113 tests before the final risk-form connection; all 16 assessment-panel tests passed afterward, including three new dating/manual-edit checks. Pregnancy page/tracker tests cover profile submission, milestone updates, error handling, connected care and bounded trends. Shared/backend builds and the frontend production build pass.

Live browser QA uses an isolated temporary database, backend on 5002 and frontend on 5175, leaving the user's database untouched. Verified login, 24 weeks + 3 days, EDD, trimester, visible weight chart, symptom/appointment context, milestone persistence after reload and corresponding reminder removal. Completing the pregnancy removes milestone actions while retaining its readings and appointment context. Temporary QA services are stopped after verification.

## Run and Git

Open `C:/Users/vinut/maaSuraksha` in VS Code and ensure MongoDB is running. Run `npm run build:shared` after shared changes, then run `npm run dev:backend` and `npm run dev:frontend` in separate terminals. Open `http://localhost:5173/login`, sign in and select Pregnancy Profile. Use the port printed by Vite if 5173 is occupied. The edited files are in this same repository.

The checkpoint excludes pre-existing root package changes. Push the checkpoint with `git push origin vinutha-work`.
