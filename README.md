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

## Important Disclaimers

- AI outputs are for **decision-support and educational purposes only**
- AI outputs are **not medical diagnoses**
- Diet guidance is educational only, never a medical prescription
- Sensitive health data must be handled with strict privacy controls

## License

MIT
