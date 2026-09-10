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

## Database
```bash
# Using Docker
docker-compose up mongodb

# Connection string
mongodb://localhost:27017/maasuraksha
```
