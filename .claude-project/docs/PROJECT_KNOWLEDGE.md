# Project Knowledge: LGTM

## Overview

OrderFlow is a backend-only REST API built with NestJS, designed specifically for testing and learning the LGTM (Loki, Grafana, Tempo, Mimir) observability stack. The API simulates an e-commerce order management system with intentionally varied response characteristics - fast CRUD endpoints, medium-latency transactional endpoints, slow report/bulk endpoints, and error-prone external service simulations - to provide comprehensive scenarios for logging, monitoring, and distributed tracing.

### Goals

1. Provide a realistic backend API with diverse performance characteristics (fast, medium, slow, error-prone endpoints) for LGTM stack testing
2. Enable comprehensive distributed tracing scenarios through cascading service calls (order -> payment -> inventory -> notification)
3. Generate meaningful logs, metrics, and traces that exercise all components of the LGTM observability stack
4. Support dynamic failure injection via chaos endpoints for testing alerting and error monitoring capabilities

### User Types

| Role | Permissions |
|------|-------------|
| Customer | Browse products, place orders, view order history, manage own profile. Authenticated via JWT (email/password). |
| Admin | Manage products, inventory, generate reports, view system health, manage users. Accounts seeded via database migration (no public signup). |

### Terminology

| Term | Definition |
|------|------------|
| Correlation ID | Unique identifier propagated across all services for a single request chain (used in distributed tracing) |
| Span | A unit of work in a distributed trace, representing a single operation |
| Trace | A collection of spans representing the full lifecycle of a request |
| SLI | Service Level Indicator - a quantitative measure of service behavior (e.g., request latency) |
| SLO | Service Level Objective - target value for an SLI (e.g., p99 latency < 500ms) |
| Hot Path | API endpoints with high traffic volume (product listing, health check) |
| Cold Path | API endpoints with low traffic but high computation (report generation) |
| Circuit Breaker | Pattern to prevent cascading failures when external services are down |
| Backpressure | Mechanism to slow down request processing when system is overloaded |
| Dead Letter Queue | Queue for failed messages that exceeded retry attempts |
| LGTM Stack | Loki (logging), Grafana (visualization), Tempo (tracing), Mimir (metrics) - a complete observability platform |
| RED Metrics | Rate, Errors, Duration - the three key metrics for monitoring request-driven services |
| OpenTelemetry (OTel) | Vendor-neutral observability framework for generating, collecting, and exporting telemetry data |
| W3C Trace Context | Standard HTTP headers (traceparent, tracestate) for distributed trace propagation |

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL (with TypeORM)
- **Queue**: BullMQ (Redis-backed)
- **Observability**: OpenTelemetry SDK -> LGTM Stack
- **Deployment**: Docker

## Architecture

```
LGTM/
├── backend/           # NestJS API server (port 3000)
├── .claude/           # Claude configuration & skills
├── .claude-project/   # Project documentation
└── docker-compose.yml # Backend + PostgreSQL + Redis
```

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Backend-only (no frontend) | Project purpose is observability testing, not user-facing | 2026-03-07 |
| NestJS with TypeORM | TypeScript ecosystem, decorator-based architecture | 2026-03-07 |
| BullMQ for async processing | Redis-backed, supports retries, dead letter queues | 2026-03-07 |
| Simulated external services | No real 3rd party dependencies, configurable failure rates | 2026-03-07 |

## Development Setup

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>

# Start services
docker-compose up -d
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_HOST` | PostgreSQL host | Yes | `localhost` | `postgres` |
| `DATABASE_PORT` | PostgreSQL port | Yes | `5432` | `5432` |
| `DATABASE_NAME` | Database name | Yes | `lgtm` | `lgtm` |
| `DATABASE_USER` | Database user | Yes | `postgres` | `postgres` |
| `DATABASE_PASSWORD` | Database password | Yes | - | `postgres` |
| `AUTH_JWT_SECRET` | JWT signing secret | Yes | - | `your-secure-secret-key-min-32-chars` |
| `AUTH_TOKEN_EXPIRE_TIME` | Access token expiration | No | `24h` | `24h` |
| `AUTH_REFRESH_TOKEN_EXPIRE_TIME` | Refresh token expiration | No | `7d` | `7d` |
| `REDIS_HOST` | Redis host for BullMQ | Yes | `localhost` | `redis` |
| `REDIS_PORT` | Redis port | Yes | `6379` | `6379` |
| `MODE` | Environment mode | Yes | `DEV` | `DEV`, `PROD` |

## External Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Simulated Payment Gateway | External payment API with configurable latency (500ms-2s) and failure rate (20%) | Mock (internal), configurable via `/chaos` endpoint |
| Simulated Warehouse API | External inventory service with variable response times (200ms-1.5s) and timeout rate (10%) | Mock (internal), configurable via `/chaos` endpoint |

---

**Last Updated:** 2026-03-07
