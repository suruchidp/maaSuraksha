# Appointments

Patients request bookings with their assigned doctor/ASHA. Assigned caregivers can
book and manage appointments on the patient's detail screen. Administrators have a
searchable patient selector at `/admin/appointments` and manage care-team assignment
through User Management. The API also permits administrators to assign an active
doctor/ASHA explicitly. Other roles cannot substitute an unrelated clinician.

All calendar dates are `YYYY-MM-DD`; times are 24-hour `HH:MM` in **Asia/Kolkata**
(IST, UTC+05:30). Calendar dates are stored at UTC midnight, while the DTO includes
the actual UTC `startsAt` instant and `timeZone`. Dates display without shifting
with the browser timezone. Invalid calendar dates, invalid times and elapsed
same-day slots are rejected. Existing records need no migration.

Authenticated endpoints:

- `POST /api/v1/appointments`: patient, optional doctor/asha, date, time, type, notes.
- `GET /api/v1/appointments`: patientId, status, view (`all`, `upcoming`, `past`), page, limit.
- `GET /api/v1/appointments/:id`: scoped detail with assignment names.
- `PATCH /api/v1/appointments/:id/status`: status and optional cancelledReason.
- `PATCH /api/v1/appointments/:id/schedule`: date and time only.

Upcoming lists active future bookings nearest first. Past/history includes elapsed
appointments and terminal bookings (including future cancellations). All lists every
accessible appointment. Access is limited to the patient, their care team, the
appointment's attached doctor/ASHA, or administrators. Patient-specific list filters
require access to that patient. Frontend caches include the signed-in actor.

Status transitions:

- Scheduled → Confirmed, Cancelled, Missed.
- Confirmed → Completed, Cancelled, Missed.
- Completed, Cancelled, Missed are terminal.

Patients can cancel or reschedule active future bookings, but cannot confirm,
complete, or mark missed. Caregivers may manage past active records; completion and
missed status require that the appointment time has arrived. Updates compare the
previous schedule and status to detect conflicting edits. Rescheduling returns a
booking to Scheduled for care-team reconfirmation; submitting the same time is a
no-op. Cancellation reasons are bounded to 500 characters.

Persistent in-app reminders are generated within 24 hours of upcoming scheduled or
confirmed bookings. Reminder keys include schedule version after rescheduling;
superseded and terminal reminders are resolved. Worker/list refresh handles deferred
generation after a successful source write. No external SMS/email is sent. Booking
is a request, not a claim of available clinician capacity; confirmation remains a
care-team action. This module does not introduce an availability/slot inventory.

Tests cover persistence, lifecycle, calendar/timezone boundaries, history filters,
patient/staff access, team substitution, reconfirmation, reminder deduplication and
retirement, frontend booking/filtering/rescheduling, and administrator lookup errors.
Live verification uses only synthetic QA data.
