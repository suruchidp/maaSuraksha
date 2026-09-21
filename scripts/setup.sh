# MaaSuraksha Development Scripts

## Setup
```bash
# Install all dependencies
npm install

# Copy environment file
cp .env.example .env
```

## Development
```bash
# Run all services concurrently
npm run dev

# Run individual services
npm run dev:frontend
npm run dev:backend
npm run dev:ml
```

## Build
```bash
# Build all
npm run build

# Build individual
npm run build:shared
npm run build:frontend
npm run build:backend
```

## Quality
```bash
npm run typecheck
npm run test
npm run lint
```

# ---- Development Admin Account ----
# Public registration never allows ADMIN accounts. Seed a dev-only ADMIN with:
#   ADMIN_SEED_NAME="Dev Admin" ADMIN_SEED_EMAIL=admin@example.com ADMIN_SEED_PASSWORD='<secret>' npm run seed:admin
#   # or via flags (flags win over env vars):
#   npm run seed:admin -- --name "Dev Admin" --email admin@example.com --password '<secret>'
#
# - Connects using MONGODB_URI; reuses the User model's bcrypt hashing.
# - Creates role=ADMIN, isActive=true.
# - Refuses to create a duplicate ADMIN if one already exists (non-zero exit).
# - Never prints the password.
# - Development-only; refuses NODE_ENV=production and must never be an endpoint.

## Database
```bash
# Using Docker
docker-compose up mongodb

# Connection string
mongodb://localhost:27017/maasuraksha
```
