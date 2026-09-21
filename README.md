# MaaSuraksha

Maternal Health Monitoring and Decision-Support Platform for Rural/Resource-Constrained Settings.

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7+ (or use Docker)
- npm

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Development

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:frontend   # Frontend on port 5173
npm run dev:backend    # Backend on port 5000
npm run dev:ml         # ML service on port 8000
```

### 4. Using Docker

```bash
docker-compose up
```

## Architecture

```
maasuraksha/
├── apps/
│   ├── frontend/       # React + Vite + TypeScript
│   ├── backend/        # Express + TypeScript + MongoDB
│   └── ml-service/     # FastAPI + Python ML
├── packages/
│   └── shared/         # Shared types, validations, constants
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

## Tech Stack

**Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Tailwind CSS, react-i18next

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Zod, Helmet, CORS

**ML Service:** Python, FastAPI, XGBoost, scikit-learn, SHAP, Hugging Face Transformers, PyTorch, DistilBERT

## User Roles

| Role | Description |
|------|-------------|
| PATIENT | Maternal health monitoring, mood journal, assessments |
| ASHA | Community health worker, patient management |
| DOCTOR | Clinical oversight, detailed assessments, referrals |
| ADMIN | System management, user management, content |

## Languages

- English
- Hindi
- Kannada

## Features

- Pregnancy tracking (LMP, EDD, gestational week, trimester)
- Health metrics monitoring (BP, weight, glucose, HR, temperature)
- Maternal health risk prediction (XGBoost + SHAP)
- GDM detection (XGBoost + SHAP)
- PPD screening (DistilBERT NLP)
- Mood journal with NLP analysis
- Safety escalation for distress content
- Recommendations engine
- Diet guidance (educational only)
- Alerts and referrals
- Appointments management
- Educational content (trilingual)
- AI health assistant chatbot
- Reports generation
- Role-based dashboards

## API Endpoints

- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile

## ML Endpoints

ML service (FastAPI on port 8000). Models stay `MODEL_UNAVAILABLE` until
real, trained artifacts exist (see `docs/DATASETS.md` + `docs/ML_ARTIFACTS.md`).

- `GET /health` - Service health & per-model status
- `GET /api/v1/models/status` - Model availability, version & reason
- `POST /api/v1/maternal-risk/predict` - Maternal risk prediction (XGBoost + SHAP)
- `POST /api/v1/gdm/predict` - GDM detection (XGBoost + SHAP)
- `POST /api/v1/ppd/predict` - PPD screening (DistilBERT free text)
- `POST /api/v1/mood/analyze` - Mood analysis + crisis safety (DistilBERT / RULE_BASED)

## Development Commands

```bash
npm run build          # Build all packages
npm run typecheck      # Type-check all packages
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run clean          # Clean build artifacts
```

## Seed a Development Admin Account

Public registration (`POST /api/v1/auth/register`) intentionally **never**
allows `ADMIN` accounts — that behavior is unchanged. To create a development
`ADMIN` in a local database, use the development-only helper
`scripts/seed-admin.ts`:

```bash
# Via environment variables
ADMIN_SEED_NAME="Dev Admin" \
ADMIN_SEED_EMAIL=admin@example.com \
ADMIN_SEED_PASSWORD='<your-secret>' \
npm run seed:admin
```

```bash
# Or via command-line flags (flags take precedence over env vars)
npm run seed:admin -- --name "Dev Admin" --email admin@example.com --password '<your-secret>'
```

What it does and guarantees:

- Connects using `MONGODB_URI` (from `.env` or your environment).
- Reuses the existing `User` model, so the password is hashed with the same
  bcrypt mechanism (12 rounds) used for normal users and satisfies the same
  password policy (≥ 8 chars, upper + lower + digit).
- Creates the account with `role=ADMIN` and `isActive=true`.
- **Refuses** to create a duplicate `ADMIN` if one already exists and exits
  with a non-zero code; it never overwrites or prints the password.
- The script is **development-only**: it refuses to run against
  `NODE_ENV=production` and must **never** be mounted as an API endpoint.

## Important Disclaimers

- AI outputs are for **decision-support and educational purposes only**
- AI outputs are **not medical diagnoses**
- Diet guidance is educational only, never a medical prescription
- Sensitive health data must be handled with strict privacy controls

## License

MIT
