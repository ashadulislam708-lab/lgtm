# LGTM

> OrderFlow is a backend-only REST API built with NestJS, designed for testing and learning the LGTM (Loki, Grafana, Tempo, Mimir) observability stack. It simulates an e-commerce order management system with varied response characteristics for comprehensive logging, monitoring, and distributed tracing scenarios.

## Features

1. Realistic backend API with diverse performance characteristics (fast, medium, slow, error-prone endpoints) for LGTM stack testing
2. Comprehensive distributed tracing scenarios through cascading service calls (order -> payment -> inventory -> notification)
3. Meaningful logs, metrics, and traces that exercise all components of the LGTM observability stack
4. Dynamic failure injection via chaos endpoints for testing alerting and error monitoring

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL (TypeORM)
- **Queue**: BullMQ (Redis-backed)
- **Observability**: OpenTelemetry SDK -> LGTM Stack
- **Deployment**: Docker

## Architecture

```
LGTM/
├── backend/              # NestJS API server
├── .claude/              # Claude configuration & skills
├── .claude-project/      # Project documentation
└── docker-compose.yml    # Service orchestration
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Installation

```bash
# Clone repository with submodules
git clone --recurse-submodules <repo-url>
cd LGTM

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Service URLs

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Development

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```

### Database Migrations

```bash
cd backend
npm run migration:generate -- MigrationName
npm run migration:run
```

## Documentation

- **Quick Reference**: See [CLAUDE.md](CLAUDE.md) for Claude context
- **Full Documentation**: See `.claude-project/docs/`
  - [PROJECT_KNOWLEDGE.md](.claude-project/docs/PROJECT_KNOWLEDGE.md) - Architecture
  - [PROJECT_API.md](.claude-project/docs/PROJECT_API.md) - API specs
  - [PROJECT_DATABASE.md](.claude-project/docs/PROJECT_DATABASE.md) - Database schema

## Project Structure

```
backend/
├── src/
│   ├── modules/         # Feature modules
│   ├── entities/        # TypeORM entities
│   ├── dto/             # Data transfer objects
│   └── guards/          # Auth guards
└── test/                # E2E tests
```

## Testing

```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

## Deployment

### Production Build

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Create feature branch from `dev`
2. Make changes and commit
3. Push and create PR to `dev`
4. After review, merge to `dev`
5. `dev` -> `main` for production releases

---

**Generated:** 2026-03-07
