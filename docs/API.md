# MaaSuraksha Backend API

REST API for the maternal-health monitoring and decision-support platform.
Base URL: `/api/v1` (production deployments should place the API behind an HTTPS
reverse proxy).

All request/response bodies are JSON. Every response follows the shape below.

## Response envelope

```json
{
  "success": true,
  "data": { },
  "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
}
```

Errors:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": [] }
}
```

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Request validation failed (Zod / schema) |
| 401 | `UNAUTHORIZED` | Missing / invalid token, bad credentials |
| 403 | `FORBIDDEN` | Authenticated but not allowed for this resource |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource (e.g. existing email) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

## Authentication

All endpoints except `/health` and `/auth/register`, `/auth/login` require a
Bearer token:

```
Authorization: Bearer <token>
```

- Tokens are issued by `/auth/login` and `/auth/register`.
- JWT contains `userId` and `role`. `auth` middleware re-verifies the user
  exists and is active on every request.
- Role-based access uses `authorize()` middleware plus service-level ownership
  checks via `accessService`.

### Roles

| Role | Access model |
| --- | --- |
| `PATIENT` | Own data only; own chat; can book own appointments |
| `ASHA` | Patients where `assignedASHA` matches; no admin; can create referrals |
| `DOCTOR` | Patients where `assignedDoctor` matches; can create recommendations |
| `ADMIN` | Everything; created only via `/admin/users` |

Ownership rule for caregiver roles: a target patient id may appear as
`?userId=` (or in the request body for assessments). Access is denied with
`403` unless the target is assigned to the caller.

## Rate limiting

- `/api/*`: 100 requests / 15 minutes.
- `/api/v1/auth/*`: 20 requests / 15 minutes (stricter for credential attempts).

## Endpoints

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | no | Liveness: `{ status, service, version, uptime, timestamp, environment }` |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | no | Create a `PATIENT`/`ASHA`/`DOCTOR` account. `ADMIN` rejected with 403. Returns `token` + `user`. |
| POST | `/api/v1/auth/login` | no | Login with `email` + `password`. Returns `token` + `user`. Rejects deactivated accounts. |
| GET | `/api/v1/auth/me` | yes | Current user profile (alias: `/api/v1/auth/profile`). |

`register` request body:

```json
{
  "name": "Aarti Sharma",
  "email": "aarti@example.com",
  "password": "Str0ngPass",
  "role": "PATIENT",
  "phone": "+91 98xxxxxx",
  "language": "en"
}
```

`language` ∈ `en | hi | kn`. Passwords are bcrypt-hashed (12 rounds);
`password` is never returned by the API.

### Pregnancy profile

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| PUT/POST | `/api/v1/pregnancy` | yes | Create or update the profile. Caregivers pass `?userId=`; patients omit it. |
| GET | `/api/v1/pregnancy` | yes | Current profile (with `?userId=` for caregivers/admin). |

The service computes `expectedDueDate` (280 days from LMP), `gestationalWeek`
and `trimester`. `riskFactors` with any entries sets `isHighRisk`.

```json
{
  "lmp": "2026-01-15",
  "gravida": 2,
  "para": 1,
  "medicalHistory": ["mild anemia"],
  "riskFactors": ["previous C-section"]
}
```

### Health metrics

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/health-metrics` | yes | Record a metric (all fields optional, at least one expected). |
| GET | `/api/v1/health-metrics` | yes | List, with `?userId=`, `?fromDate=`, `?toDate=` filters + pagination. |
| GET | `/api/v1/health-metrics/:id` | yes | Single metric. |
| PATCH | `/api/v1/health-metrics/:id` | yes | Update metric fields. |

`POST` body: `systolicBP`, `diastolicBP`, `weight`, `glucose`, `heartRate`,
`temperature`, `hemoglobin`, `date` (ISO, default now), `notes`.

### Symptoms

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/symptoms` | yes | Report symptoms. |
| GET | `/api/v1/symptoms` | yes | List with `?userId=`, `?severity=`. |
| GET | `/api/v1/symptoms/:id` | yes | Single report. |

`POST` body: `symptoms` (array, min 1), `severity` (`mild|moderate|severe|critical`), `notes`, `date`.

### Assessments

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/assessments/maternal-risk` | yes | Store maternal risk inputs. |
| GET | `/api/v1/assessments/maternal-risk` | yes | List. |
| GET | `/api/v1/assessments/maternal-risk/latest/:userId` | yes | Latest for a patient. |
| POST | `/api/v1/assessments/gdm` | yes | Store GDM inputs. |
| GET | `/api/v1/assessments/gdm` | yes | List. |
| GET | `/api/v1/assessments/gdm/latest/:userId` | yes | Latest GDM. |
| POST | `/api/v1/assessments/ppd` | yes | Store EPDS answers. |
| GET | `/api/v1/assessments/ppd` | yes | List. |
| GET | `/api/v1/assessments/ppd/latest/:userId` | yes | Latest PPD. |

`POST` body: `maternal-risk:` `age`, `systolicBP`, `diastolicBP`, `bloodSugar`,
`bodyTemp`, `heartRate`, `bmi`, `gestationalWeek` (+ optional `hemoglobin`).
Units for maternal-risk: `bloodSugar` is in **mg/dL**, `bodyTemp` in **°C**.
These are application/external units; the ML service converts them to the
model's internal units (mmol/L and °F) once at the model-input boundary — see
`docs/MATERNAL_RISK_UNIT_CONVERSION.md`.
`POST gdm:` (Stage 1 early-risk assessment / decision support): `age`,
`pregnancyCount`, `previousPregnancyGestation`, `diastolicBP`, `familyHistory`
+ optional `bmi`, `hdl`, `systolicBP`, `hemoglobin`, `unexplainedPrenatalLoss`,
`largeChildOrBirthDefect`, `pcos`, `sedentaryLifestyle`. Optional *clinical*
glucose measurements (`fastingGlucose`, `postprandialGlucose`, `hba1c`) are
stored for Stage 2 record-keeping but are **never sent to the model**. The
result message states the prediction is a risk estimate, not a diagnosis.
`POST ppd:` `edinburghAnswers` (required, 10 × 0–3) + optional `screeningText`
(≤5000 chars) which triggers the DistilBERT free-text screening.

**ML integration policy (Phase 4):** The backend calls the ML service
best-effort (`ML_SERVICE_URL`, default `http://localhost:8000`, 1.5s timeout)
for every assessment/mood entry. If the ML service is unreachable **or** the
model is `MODEL_UNAVAILABLE`, records stay `status: "pending"` with an
explicit `message`; nothing is fabricated. When the ML model is available,
records are updated to `completed` (assessments) / `analyzed` (mood) with the
real prediction, probability, risk level, optional SHAP values and
`modelVersion`. PPD `screeningText` is only used for NLP screening; EPDS
scores are still not computed or invented.

### Mood

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/mood` | yes | Store a secure journal entry. |
| GET | `/api/v1/mood` | yes | List (with `?userId=`). |
| GET | `/api/v1/mood/:id` | yes | Single entry. |

`POST` body: `journalText` (1–2000 chars). Entries are stored securely and
best-effort NLP analysis is attempted: model-backed sentiment sets
`status: "analyzed"`; otherwise the deterministic crisis safety heuristic
(en/hi/kn) still updates `safetyFlag`/`safetyNotes` while status stays
`pending` until a trained model exists. No sentiment is ever faked.

### Recommendations

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/recommendations` | yes | DOCTOR, ASHA, ADMIN | Create a recommendation (`?userId=` target). |
| GET | `/api/v1/recommendations` | yes | all | List with `?category=`. |
| GET | `/api/v1/recommendations/:id` | yes | all | Single. |
| PATCH | `/api/v1/recommendations/:id/read` | yes | all | Mark read/unread (`{"read": true}`). |

### Diet plans

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/diet-plans` | yes | DOCTOR, ASHA, ADMIN | Create a plan (`?userId=` target). |
| GET | `/api/v1/diet-plans` | yes | all | List. |
| GET | `/api/v1/diet-plans/:id` | yes | all | Single. |

### Alerts

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/alerts` | yes | DOCTOR, ASHA, ADMIN | Raise an alert. |
| GET | `/api/v1/alerts` | yes | all | List with `?userId=`, `?status=`. |
| GET | `/api/v1/alerts/:id` | yes | all | Single. |
| PATCH | `/api/v1/alerts/:id/status` | yes | all | Update `status`. |

### Referrals

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/referrals` | yes | ASHA, DOCTOR, ADMIN | Create a referral. |
| GET | `/api/v1/referrals` | yes | all | List with `?patientId=`. |
| GET | `/api/v1/referrals/:id` | yes | all | Single. |
| PATCH | `/api/v1/referrals/:id/status` | yes | all | Update `status` + optional `note`. |

### Appointments

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/appointments` | yes | Book an appointment (`/auth/me` for role context). |
| GET | `/api/v1/appointments` | yes | List with `?patientId=`, `?status=`. |
| GET | `/api/v1/appointments/:id` | yes | Single (related parties only). |
| PATCH | `/api/v1/appointments/:id/status` | yes | Update `status` + optional `cancelledReason`. |

### Education

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/education` | yes | all | List active content, `?category=`, `?lang=`. |
| GET | `/api/v1/education/:id` | yes | all | Single, localized by `?lang=`. |
| POST | `/api/v1/education` | yes | ADMIN | Create trilingual content. |
| PATCH | `/api/v1/education/:id` | yes | ADMIN | Update content. |

Content `title`/`body` are objects keyed by `en | hi | kn`.

### Chat (caregiver bot)

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/chat` | yes | PATIENT, ADMIN | Open a conversation. |
| GET | `/api/v1/chat` | yes | PATIENT, ADMIN | List own conversations. |
| GET | `/api/v1/chat/:id` | yes | PATIENT, ADMIN | Conversation detail. |
| POST | `/api/v1/chat/:id/messages` | yes | PATIENT, ADMIN | Send a message. Returns an explicit "assistant unavailable" reply until Phase 4. |
| GET | `/api/v1/chat/:id/messages` | yes | PATIENT, ADMIN | Paginated messages. |

### Reports

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/reports` | yes | Generate a report (`?userId=` for caregiver authoring). |
| GET | `/api/v1/reports` | yes | List (list omits the full `data` payload). |
| GET | `/api/v1/reports/:id` | yes | Single report with full `data`. |

### Admin

| Method | Path | Auth | Roles | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/overview` | yes | ADMIN | System counters. |
| GET | `/api/v1/admin/users` | yes | ADMIN | List users (`?role=`). |
| POST | `/api/v1/admin/users` | yes | ADMIN | Create any user incl. `ADMIN`. |
| PATCH | `/api/v1/admin/users/:id` | yes | ADMIN | Update role, `isActive`, `assignedASHA`, `assignedDoctor`. |
| GET | `/api/v1/admin/audit-logs` | yes | ADMIN | Paginated audit trail. |

## Pagination

`page` (default 1) and `limit` (default 20, max 100) query params. Lists return
a `pagination` envelope: `{ page, limit, total, pages }`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | Env label |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/maasuraksha` | Mongo connection string |
| `JWT_SECRET` | dev-only default | Secret for signing tokens; set a strong value in production |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `CORS_ORIGIN` | `*` for dev | Allowed frontend origin(s) |

## Security & privacy notes

- Passwords are bcrypt-hashed; `password` is never returned or logged.
- JWTs are never logged. Journal text is stored encrypted-at-rest by the DB
  provider; the API never logs journal contents.
- Helmet, strict CORS, and rate limiting are applied; the auth route has a
  tighter limit.
- Ownership checks are enforced in services, not just middleware, so every
  read/write path verifies caregiver assignment or self-ownership.
- Sensitive actions (register/login, admin ops) are recorded in the
  `AuditLog` collection.