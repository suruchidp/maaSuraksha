# Alerts & Notifications

## Coverage
- Completed maternal risk and GDM screenings: moderate/medium, high and critical results generate follow-up alerts. Pending/unavailable/low results do not.
- Recent blood pressure: >=140 systolic OR >=90 diastolic generates warning; >=160 OR >=110 generates urgent review. Only readings in the last 24 hours qualify. No diagnosis or treatment is inferred.
- Pregnancy profile: recorded risk factors generate care-plan follow-up; an estimated due date within seven days generates one reminder.
- Appointments: scheduled/confirmed visits within 24 hours generate one reminder. Times use Asia/Kolkata (+05:30), the product's current deployment timezone. Cancellation resolves the reminder.
- Authorized care staff can also create alerts in the existing categories (vitals, symptom, assessment, mood safety, follow-up, appointment, referral).
- No medication scheduling model exists; medication reminders are not implemented.

BP reference: [NICE NG133](https://www.nice.org.uk/guidance/ng133/chapter/recommendations).

## Persistence and delivery
Alert generation runs after relevant writes and in a backend worker every minute. Patient list/summary requests also refresh rules as recovery. Notifications are in-app; there is no email, SMS or Web Push provider. The backend and MongoDB must be running. The bell and open alert center refresh every 30 seconds.

An indexed unique (user, dedupeKey) pair makes engine upserts safe across concurrent refreshes. Replaying a source never resets read/acknowledged state. BP deduplication is per reading day and severity band, allowing same-day escalation. Assessment deduplication is per assessment and risk level. Pregnancy reminders are per profile/due date; appointment reminders are per booking. New assessments can create new follow-up alerts. Existing staff-created alerts without keys remain valid.

Read state is distinct from acknowledgment and only the recipient can mark read. Patients acknowledge; care staff resolve. Resolved alerts cannot reopen; acknowledged alerts cannot be reset to pending. Historical clinical alerts remain for care-team review even if a newer reading is normal. No automatic medical resolution is inferred.

The interface labels support English, Hindi and Kannada. Generated rule messages currently use English; staff-authored text is displayed as entered.

## APIs
- GET /api/v1/alerts?page=1&limit=20&status=pending&unread=true
- GET /api/v1/alerts/summary -> unread and pending totals, limited by ownership
- PATCH /api/v1/alerts/:id/read
- PATCH /api/v1/alerts/:id/status -> pending/acknowledged/resolved, with role/transition checks
- POST /api/v1/alerts -> authorized doctor/ASHA/admin creation

## Verification
API/database tests cover real persistence, ownership, unread, acknowledgment, clinical resolution, invalid filters, concurrent deduplication, escalation and unavailable-model honesty. Pure rules tests cover BP boundaries, stale readings and reminder windows. UI tests cover actions, pagination and failures.

A live browser walkthrough on localhost used a synthetic QA patient and synthetic BP reading: generated urgent alert -> unread bell 1 -> mark read -> bell 0 -> acknowledge -> acknowledged card -> empty unread filter. Synthetic data is named "Synthetic Alerts QA" and is not a real medical record.

Run:
```
npm run test --workspace=apps/backend -- tests/alerts.test.ts
npm run test --workspace=apps/frontend -- src/pages/patient/Alerts.test.tsx
npm run typecheck:frontend
npm run typecheck:backend
```
