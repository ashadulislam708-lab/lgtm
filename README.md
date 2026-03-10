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

---

## LGTM Observability Architecture Overview

### What is Observability?

Observability is the ability to understand **what is happening inside your system** by looking at the data it produces. It has **three pillars**:

| Pillar | What it answers | Example | Tool |
|--------|----------------|---------|------|
| **Logs** | What happened? | `"Order #123 failed: payment timeout"` | **Loki** |
| **Metrics** | How is the system performing? | `95th percentile latency = 200ms` | **Mimir** |
| **Traces** | Where did the request go? | Request flow across services with timing | **Tempo** |

### What is LGTM?

LGTM is an acronym for the four tools that make up the observability stack:

| Letter | Tool | Role |
|--------|------|------|
| **L** | **Loki** | Log aggregation and storage |
| **G** | **Grafana** | Visualization, dashboards, and alerting |
| **T** | **Tempo** | Distributed trace storage |
| **M** | **Mimir** | Metrics storage (Prometheus-compatible) |

---

### High-Level Architecture

**Quick Overview:**

```
NestJS App ──(OTLP)──▶ OTel Collector ──▶ Loki  (Logs)    ──┐
                                     ├──▶ Tempo (Traces)  ──┼──▶ Grafana (Dashboard)
                                     └──▶ Mimir (Metrics) ──┘
```

**Detailed View:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NestJS Application                            │
│                                                                         │
│   ┌────────────┐    ┌──────────────┐    ┌───────────────────────────┐   │
│   │  Winston   │    │  prom-client  │    │  OpenTelemetry SDK        │   │
│   │  (Logs)    │    │  (Metrics)    │    │  (Traces + Auto-Instr.)   │   │
│   └─────┬──────┘    └──────┬───────┘    └─────────────┬─────────────┘   │
│         │                  │                          │                  │
│         └──────────────────┼──────────────────────────┘                  │
│                            │                                            │
│                      OTLP (gRPC/HTTP)                                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       OTel Collector                                   │
│                       (Port: 4317 gRPC / 4318 HTTP)                    │
│                                                                        │
│   ┌────────────┐     ┌──────────────┐     ┌─────────────────────────┐  │
│   │ Receivers  │     │ Processors   │     │ Exporters               │  │
│   │            │     │              │     │                         │  │
│   │ otlp:      │────▶│ batch:       │────▶│ loki (logs)        ─────┼──▶ Loki
│   │  grpc:4317 │     │  timeout: 5s │     │ otlphttp (traces)  ─────┼──▶ Tempo
│   │  http:4318 │     │ filter:      │     │ prometheusremote-  ─────┼──▶ Mimir
│   │            │     │  drop /health│     │  write (metrics)        │  │
│   └────────────┘     └──────────────┘     └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │   Loki   │  │  Tempo   │  │  Mimir   │
        │          │  │          │  │          │
        │ Stores:  │  │ Stores:  │  │ Stores:  │
        │  Logs    │  │  Traces  │  │  Metrics │
        │          │  │          │  │          │
        │ Query:   │  │ Query:   │  │ Query:   │
        │  LogQL   │  │  TraceQL │  │  PromQL  │
        │          │  │          │  │          │
        │ Port:    │  │ Port:    │  │ Port:    │
        │  3100    │  │  3200    │  │  9009    │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    ┌─────────────┐
                    │   Grafana   │
                    │             │
                    │ Dashboards  │
                    │ Alerts      │
                    │ Explore     │
                    │             │
                    │ Port: 3001  │
                    └─────────────┘
```

---

### Component Details

#### 1. NestJS Application (Data Producer)

The application generates all three types of telemetry data:

| Component | Package | What it does |
|-----------|---------|-------------|
| **Winston Logger** | `winston` | Creates structured log entries for every request and event |
| **Metrics Interceptor** | `prom-client` | Tracks request count, error rate, latency histograms |
| **OpenTelemetry SDK** | `@opentelemetry/sdk-node` | Creates traces/spans for every request with auto-instrumentation |

Auto-instrumentation automatically traces:
- HTTP incoming/outgoing requests
- Database queries (TypeORM / PostgreSQL)
- Redis / BullMQ operations
- External API calls

#### 2. OTel Collector (Middleware)

The OpenTelemetry Collector sits between the app and the storage backends. It:

```
Receives ──▶ Processes ──▶ Exports

  OTLP         Batching       Loki (logs)
  gRPC         Filtering      Tempo (traces)
  HTTP         Sampling       Mimir (metrics)
               Enriching
```

**Why use a Collector instead of direct export?**

| Without Collector | With Collector |
|-------------------|----------------|
| App connects to 3 backends directly | App connects to 1 endpoint only |
| Changing backend = redeploy app | Changing backend = edit YAML config |
| Filtering done in app code | Filtering done in Collector config |
| Backend downtime affects app | Collector buffers data, app unaffected |
| Each service manages its own export | Centralized telemetry pipeline |

#### 3. Loki (Log Storage)

- Receives logs from OTel Collector
- Indexes logs by **labels** (service name, level, etc.), not full text
- Query language: **LogQL**
- Example: `{service="orderflow-backend"} |= "error" | json | status_code >= 500`
- Lightweight alternative to Elasticsearch

#### 4. Tempo (Trace Storage)

- Receives traces (spans) from OTel Collector
- Stores complete distributed traces with timing information
- Query language: **TraceQL**
- Example: `{duration > 500ms && status = error}`
- Only indexes trace IDs — very cost-effective

#### 5. Mimir (Metrics Storage)

- Receives metrics from OTel Collector via Prometheus Remote Write
- Stores time-series data (counters, gauges, histograms)
- Query language: **PromQL**
- Example: `rate(http_requests_total{status_code=~"5.."}[5m])`
- Horizontally scalable Prometheus alternative

#### 6. Grafana (Visualization)

- Connects to Loki, Tempo, and Mimir as data sources
- Provides dashboards, alerts, and an explore interface
- **Correlation**: Jump from a metrics spike → related traces → specific logs

```
  Metrics spike ──click──▶ Traces at that time ──click──▶ Logs for that span
```

---

### Data Flow: Single Request Lifecycle

When a user makes `POST /api/orders`:

```
Step 1: REQUEST ARRIVES
        │
        ▼
Step 2: NestJS App processes it
        ├── OTel SDK creates a Trace with Spans (auto-instrumented)
        ├── Logging Interceptor writes a structured Log entry
        └── Metrics Interceptor updates Counters & Histograms
        │
        ▼
Step 3: All telemetry sent to OTel Collector via OTLP (gRPC :4317)
        │
        ▼
Step 4: Collector processes (batch, filter, enrich)
        │
        ├──▶ Log  ──▶ Loki   (stored, indexed by labels)
        ├──▶ Trace ──▶ Tempo  (stored, indexed by trace ID)
        └──▶ Metric ──▶ Mimir (stored as time-series)
        │
        ▼
Step 5: Grafana queries all three backends
        └── Dashboard shows:
            ├── Request rate graph (from Mimir)
            ├── Error logs (from Loki)
            └── Trace waterfall (from Tempo)
```

---

### Correlation: Connecting the Three Pillars

The real power of the LGTM stack is **correlation** — connecting logs, metrics, and traces:

```
Problem: "Users are reporting slow orders"

Step 1: CHECK METRICS (Mimir → Grafana)
        "P95 latency jumped from 200ms to 2000ms at 14:30"
                    │
                    ▼ click on the spike
Step 2: CHECK TRACES (Tempo → Grafana)
        "POST /api/orders took 1800ms"
        "Payment Service span took 1600ms ← bottleneck found!"
                    │
                    ▼ click on the slow span
Step 3: CHECK LOGS (Loki → Grafana)
        "PaymentService: Stripe API timeout after 1500ms"
        "Retrying payment... attempt 2 of 3"

Root Cause: Stripe API was having issues at 14:30
```

---

### Docker Services Overview

```
┌─────────────────────────────────────────────────────┐
│                Docker Network (lgtm-network)        │
│                                                     │
│  APPLICATION LAYER:                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ NestJS   │  │PostgreSQL│  │  Redis   │          │
│  │ :3000    │  │ :5432    │  │  :6379   │          │
│  └────┬─────┘  └──────────┘  └──────────┘          │
│       │                                             │
│  COLLECTION LAYER:                                  │
│  ┌────▼─────────────┐                               │
│  │  OTel Collector  │                               │
│  │  :4317 / :4318   │                               │
│  └──┬─────┬─────┬───┘                               │
│     │     │     │                                   │
│  STORAGE LAYER:                                     │
│  ┌──▼───┐ ┌──▼───┐ ┌──▼───┐                        │
│  │ Loki │ │Tempo │ │Mimir │                        │
│  │:3100 │ │:3200 │ │:9009 │                        │
│  └──┬───┘ └──┬───┘ └──┬───┘                        │
│     │        │        │                             │
│  VISUALIZATION LAYER:                               │
│  ┌──▼────────▼────────▼──┐                          │
│  │       Grafana         │                          │
│  │       :3001           │                          │
│  └───────────────────────┘                          │
└─────────────────────────────────────────────────────┘
```

### Port Reference

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| NestJS App | 3000 | HTTP | Application REST API |
| PostgreSQL | 5432 | TCP | Database |
| Redis | 6379 | TCP | Queue (BullMQ) |
| OTel Collector | 4317 | gRPC | Telemetry ingestion (primary) |
| OTel Collector | 4318 | HTTP | Telemetry ingestion (alternative) |
| Loki | 3100 | HTTP | Log storage & query API |
| Tempo | 3200 | HTTP | Trace storage & query API |
| Mimir | 9009 | HTTP | Metrics storage & query API |
| Grafana | 3001 | HTTP | Dashboards & visualization UI |

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:3000 | - |
| Grafana | http://localhost:3001 | admin / admin |
| Loki API | http://localhost:3100 | - |
| Tempo API | http://localhost:3200 | - |
| Mimir API | http://localhost:9009 | - |

---

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

See the [Port Reference](#port-reference) and [Service URLs](#service-urls) tables above for all available endpoints.

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
