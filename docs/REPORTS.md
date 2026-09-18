# Reports & Health Records

## Patient and care-team workflow

Open `/patient/reports` to add dated structured records, browse categories, edit your own entries, archive/restore them, and generate saved reports. Assigned doctors and ASHA workers have the same workspace on the patient detail screen. Only the original record author can change a record; report snapshots are immutable. Changed assignments immediately revoke server access.

Record categories: lab result, ultrasound, prescription, discharge summary, visit note, other. These are structured notes, not file attachments or a prescription/medication scheduling engine. Dates are valid calendar days and cannot be in the future. Record edits require the last `updatedAt`; conflicting changes return 409 and require refresh.

Report types: comprehensive, pregnancy summary, health metrics, maternal risk, GDM, PPD. An optional date window filters dated entries. The pregnancy section reflects the current profile at generation time. Each collection includes the newest 100 entries and exposes total/included/truncated; narrow the date window to retrieve older entries. Instant timestamps use India day boundaries; calendar-only records and appointments retain their recorded calendar date. Unavailable assessments remain unavailable, without invented scores. Journal entries, private PPD screening text and NLP content are excluded.

Reports have a readable section viewer and authenticated JSON export. Existing legacy reports are listed, but the structured viewer asks for a new snapshot rather than guessing their schema. The primary patient workflow is localized in English, Hindi and Kannada; clinical field labels currently retain English wording in Hindi/Kannada views.

## API

All endpoints require authentication. Patient access is restricted to self; staff access to currently assigned patients; admins retain existing cross-patient access.

- `POST /api/v1/health-records?userId=...` — strict structured record input; author/user are assigned by the server.
- `GET /api/v1/health-records` — pagination, optional userId/category/archived/search; archived defaults false; search is a literal title match.
- `GET /api/v1/health-records/:id` — authorized detail.
- `PATCH /api/v1/health-records/:id` — original author only; editable record fields or isArchived, plus required updatedAt.
- `POST /api/v1/reports?userId=...` — type, optional title/fromDate/toDate; rejects caller-supplied report data.
- `GET /api/v1/reports` — paginated summaries, optional userId/type; omits snapshot data.
- `GET /api/v1/reports/:id` — authorized immutable snapshot, used by the viewer and JSON export.

Patient creation defaults to self; staff/admin creation must specify a patient. No database migration is required: Mongoose creates the new HealthRecord collection on first use.

## Verification

115 backend and 104 frontend regression tests passed. New integration checks cover persistence, stale writes, archive/restore, author controls, patient isolation, assignment revocation, private screening exclusion, immutable snapshots, India-day boundaries, pagination, truncation and invalid inputs. Frontend checks cover valid generation, date-range rejection, FormData submission, error preservation, viewing, JSON Blob export and attribution. Type checks and the frontend production build pass.

Live browser verification used an isolated temporary database/backend on port 5002 and frontend on 5175, leaving the user's running app/database untouched. Verified login, record creation, report generation with saved BP and record contents, archive/restore and persistence after reload. JSON export is covered by a frontend test; the Codex in-app browser did not expose a download event, so actual file delivery remains a manual Chrome/Edge check. Temporary QA services were stopped afterward.

## Run in VS Code

Open `C:/Users/vinut/maaSuraksha`. Ensure MongoDB is running. In separate terminals run `npm run dev:backend` and `npm run dev:frontend`; if shared contracts need rebuilding first run `npm run build:shared`. Open `http://localhost:5173/login`, sign in, and select Reports. Changes are in the same local repository VS Code opens.
