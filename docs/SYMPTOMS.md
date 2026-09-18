# Symptoms and symptom tracking

Patients can log common symptoms and explicit maternal warning signs, severity
(mild/moderate/severe/critical), recorded date, optional onset date, duration in
hours, frequency (once/occasional/daily/constant), and notes. History is paginated
and can be filtered by severity. Assigned care-team members retain scoped access.
Administrators can view all records. Existing records need no migration; new fields
are optional.

Authenticated APIs:

- `POST /api/v1/symptoms`: validated entry; optional `userId` for an accessible patient.
- `GET /api/v1/symptoms`: `userId`, `severity`, `page`, `limit`.
- `GET /api/v1/symptoms/:id`: scoped detail.

The shared triage function powers both immediate frontend guidance and backend
alerts. Explicit warning signs or severe/critical severity prompt immediate medical
assessment. Moderate symptoms or an unspecified fever prompt care-team review.
Routine classification is not reassurance that a symptom is safe. Notes and unknown
symptom names are not interpreted by an AI or matched as clinical warning signs.

Reference: [CDC HEAR HER maternal warning signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html).
Generic swelling, headache, fatigue or nausea are distinguished from the explicitly
qualified warning-sign options. The rules provide decision support, not diagnosis.

Entries dated within the past 24 hours generate persistent in-app alerts when
concerning, deduplicated by patient and entry ID. Historical entries retain guidance
in history but do not generate current notifications. Worker refresh retries source
records if alert generation fails after a successful save. Alerts can be read and
acknowledged through the existing alert center. No external message or automatic
clinical referral is sent; care-team referral creation remains a separate workflow.

Verification includes API persistence/detail/history, malformed inputs, access
isolation, authentication, alert deduplication, frontend optional-field submission,
immediate warning guidance, post-save guidance and pagination/filter behavior.
Live browser verification uses a synthetic QA patient and synthetic symptom data.
