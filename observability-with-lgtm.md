# Understanding Observability with the LGTM Stack

> From "what happened last night?" to "here's exactly what happened and why" — in under 5 minutes

**Author:** Ashadul Mridha  
**Date:** April 13, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [What Is Observability?](#what-is-observability)
3. [The Three Pillars of Observability](#the-three-pillars-of-observability)
   - [Metrics](#1-metrics)
   - [Logs](#2-logs)
   - [Traces](#3-traces)
4. [Why You Need All Three Together](#why-you-need-all-three-together)
5. [The LGTM Stack](#the-lgtm-stack)
6. [Architecture: How It All Fits Together](#architecture-how-it-all-fits-together)
7. [OpenTelemetry: The Instrumentation Standard](#opentelemetry-the-instrumentation-standard)
8. [The OTel Collector: The Brain of the Pipeline](#the-otel-collector-the-brain-of-the-pipeline)
9. [Loki: Log Aggregation](#loki-log-aggregation)
10. [Tempo: Distributed Tracing](#tempo-distributed-tracing)
11. [Mimir: Metrics at Scale](#mimir-metrics-at-scale)
12. [Grafana: Connecting the Dots](#grafana-connecting-the-dots)
13. [Conclusion](#conclusion)

---

## Introduction

Let me tell you a story that probably sounds familiar.

It's 2 PM on a Tuesday. Your API is slow. Users are complaining. But you're not at your desk — you're in a meeting, grabbing lunch, or just living your life. You have no idea it's even happening.

The next morning you walk into the office and your boss meets you at the door.

*"Hey, the API was really slow yesterday around 2 PM. What happened?"*

And you're stuck. Completely stuck. You pull up the server logs — it's a wall of unformatted text. Maybe the issue already fixed itself. Maybe the container restarted overnight and the logs are gone. You weren't there, and your system left no trail.

So you say the thing every developer dreads saying: *"I don't know. I'll look into it."*

Now imagine the exact same situation — but this time you have observability set up.

You open your dashboard, set the time range to yesterday 2 PM, and within two minutes you can see everything. Response times spiked to 4 seconds. The database connection pool got exhausted. And it started the exact moment a scheduled batch job kicked off and hammered the DB with hundreds of queries at once.

You have a graph. You have traces. You have the exact log line that caused it.

You walk back to your boss with your laptop: *"Here's what happened and here's the fix."*

**That's observability.** Your system tells its own story — even when you're not watching.

That's what this blog is about. I'll walk you through what observability actually means, the three types of data that make it work, and the LGTM stack — an open-source toolset that brings it all together beautifully.

No prior knowledge needed. Let's start from zero.

---

## What Is Observability?

At its core, **observability** is the ability to understand what's happening inside your system just by looking at what it's putting out — without having to poke around, add new code, or redeploy anything.

The word comes from control engineering. A system is "observable" if you can figure out its internal state purely from its outputs. Applied to software, the question is:

> *Based on what my system is emitting right now — its logs, its metrics, its traces — can I answer any question about what it's doing?*

If yes, your system is observable. If you're flying blind, it's not.

### Observability Is Not the Same as Monitoring

People use these words interchangeably, but they mean different things.

**Monitoring** is about watching for things you already know could go wrong. You set a threshold — "alert me if error rate goes above 5%" — and you wait. It's reactive. It only catches known problems.

**Observability** is about being able to investigate *anything*, including things you never anticipated. It's not just "is something broken?" — it's "what broke, why, when, and who was affected?"

| | Monitoring | Observability |
|---|---|---|
| **Question it answers** | "Is it working?" | "Why is it broken?" |
| **Approach** | Pre-defined alerts and dashboards | Open-ended investigation |
| **Good for** | Known failure modes | Unknown, unexpected problems |
| **Limitation** | Can't help with surprises | Requires instrumentation upfront |

Think of it this way: monitoring is a smoke alarm. Observability is having a camera, floor plan, and fire inspector — so you can figure out exactly where the fire started and why.

You need both. But monitoring alone will leave you helpless when something you didn't expect goes wrong. And in production, the unexpected is the norm.

### When Does Observability Really Matter?

Short answer: as soon as your system is more complex than a single script running on one machine.

But let's be honest — if you have a personal project with 10 users, basic `console.log` probably works fine. The pain hits when the system grows. Here's how to recognize the tipping point:

**Scenario 1: A user reports "the checkout is broken"**
You check your logs. You see the request hit your API. No error. But the order never went through. Where did it break? The payment service? The inventory check? The email queue? Without observability, you're grep-ing through logs across 4 services, hoping to piece together what happened. With observability, you pull up one trace and see the full picture in seconds.

**Scenario 2: A background job fails silently at 3 AM**
No alert fires. No user complains immediately. Hours later you notice thousands of emails weren't sent. You have no idea when it broke, which jobs were affected, or what the error was — because the container restarted and took the logs with it. Observability would have caught the spike in job failures the moment it started.

**Scenario 3: Your API looks healthy, but users are angry**
Average response time: 120ms. P99 response time: 8 seconds. Your averages are lying to you. A small percentage of users are hitting a slow database query, but it's buried in the noise. Metrics with proper histograms surface this immediately.

---

Here's a quick rule of thumb:

| If your system has... | You need... |
|---|---|
| 1 service, <100 users | Basic logging is fine |
| Multiple services | Distributed tracing |
| Background workers / queues | Metrics + alerting |
| Containers (Docker/K8s) | Centralized log aggregation |
| External APIs / third parties | Error rate tracking |
| Any paying users | All of the above |

The bottom line: observability isn't about being fancy. It's about being able to answer *"what is broken, where, and why"* without waking up four engineers at 2 AM to find out.

---

## The Three Pillars of Observability

There are three types of data that together give you a complete picture of your system. Each one answers a different kind of question. Miss any one of them and you'll have blind spots.

```
┌──────────────────────────────────────────────────────┐
│                   OBSERVABILITY                      │
│                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│   │ METRICS  │    │  LOGS    │    │   TRACES     │  │
│   │          │    │          │    │              │  │
│   │ "What?"  │    │  "What   │    │ "Where and   │  │
│   │          │    │happened?"│    │   when?"     │  │
│   └──────────┘    └──────────┘    └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

### 1. Metrics

Metrics are numbers that your system continuously measures and records over time. Things like:

- How many requests per second is my API handling right now?
- What's the 95th percentile response time over the last hour?
- How many payment failures happened in the last 5 minutes?

Think of metrics like the dashboard in your car — you glance at it and immediately know your speed, fuel level, and engine temperature without having to pop the hood. Metrics are cheap to store, fast to query, and perfect for alerts.

#### Types of Metrics

| Type | What it is | Example |
|------|-----------|---------|
| **Counter** | A number that only goes up | Total requests, total errors |
| **Histogram** | Distribution of values across ranges | Response times, order amounts |
| **Gauge** | A snapshot value that can go up or down | Active DB connections, memory usage |
| **UpDownCounter** | Like a counter but can decrease too | Active background jobs in the queue |

#### The RED Method — A Simple Starting Point

If you don't know where to start with metrics, use RED. It stands for three things every HTTP service should track:

- **R**ate — how many requests per second?
- **E**rrors — what percentage of requests are failing?
- **D**uration — how long are requests taking?

Track these per endpoint and over time, and you've got a solid foundation. You'll immediately see when something starts degrading — even before users start complaining.

#### Don't Stop at Infrastructure Metrics

CPU usage and memory matter, but they don't tell the whole story. **Business metrics** are often more useful:

```
Infrastructure:  http_request_duration_p99 > 2s    ← okay, something's slow
Business:        payments_failed_total + 340        ← 340 payments are failing!
```

The infrastructure metric tells you there's a problem. The business metric tells you how bad it actually is. Add both.

#### Checking CPU and RAM Right Now

Here's what actually checking infrastructure health looks like in practice. These PromQL queries run in Grafana against Mimir:

```promql
# CPU usage % — how much of the CPU is your process consuming right now?
rate(process_cpu_seconds_total[1m]) * 100

# Memory used in MB — how much RAM is the Node process holding?
process_resident_memory_bytes / 1024 / 1024

# Host-level memory usage % — what fraction of the server's RAM is in use?
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

The first two come from the OTel SDK automatically for any Node.js process. The third (`node_memory_*`) comes from the `hostmetrics` receiver in the OTel Collector — the one that scrapes the machine itself. Once that receiver is enabled, you get CPU, memory, disk, and network for free without writing a line of application code.

So yes: run those three queries in Grafana and you can see exactly how your CPU and RAM are doing right now.

---

### 2. Logs

Logs are text records of specific things that happened in your system, with timestamps. They answer the "what exactly happened?" questions:

- What was the error message at 02:34 AM?
- What was in the request body when it failed?
- Did the retry succeed on the second attempt or the third?

Logs are the most familiar tool — every developer has used them. But there's a big difference between logs that are actually useful and logs that just make you feel like you're doing something.

#### Structured Logs vs. Plain Text Logs

Most people start with plain text logs. They look like this:

```
[2026-04-13 02:34:11] ERROR Payment failed for order ORD-12345
```

This is fine for reading manually. But at scale, when you're sifting through millions of log lines across multiple services, it's nearly useless. You can't filter by order ID. You can't group by error type. You're back to guessing.

**Structured logs** fix this. Instead of a sentence, you write a JSON object with consistent fields:

```json
{
  "timestamp": "2026-04-13T02:34:11.000Z",
  "level": "error",
  "service": "payment-service",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "orderId": "ORD-12345",
  "message": "Payment gateway timeout",
  "attempt": 2,
  "durationMs": 2001
}
```

Now you can query: *show me all errors for order ORD-12345 across every service, sorted by time.* One query. Done.

#### Correlation IDs — The Glue Between Services

Here's a problem you'll run into quickly in any multi-service system. A single user request might create 20 log entries across 4 different services. Without something connecting them, those entries look completely unrelated.

The solution is a **correlation ID** — a unique identifier that gets created at the very start of a request and passed along to every service and background job it touches.

```
User sends request → ID generated: "f47ac10b"

  auth-service     → {"correlationId": "f47ac10b", "message": "Token validated"}
  order-service    → {"correlationId": "f47ac10b", "message": "Order created"}
  payment-worker   → {"correlationId": "f47ac10b", "message": "Payment gateway timeout"}
  notification-svc → {"correlationId": "f47ac10b", "message": "Email queued"}
```

Now finding everything related to that one user's request is a single filter: `correlationId = "f47ac10b"`. It's a simple idea with an enormous payoff.

---

### 3. Traces

Traces are the most powerful and also the least understood of the three pillars. Let me explain it simply.

When a user makes a request to your API, it doesn't just go to one place. It might:
1. Hit your API server
2. Query the database
3. Call an external payment API
4. Push a job to a background queue
5. Have a worker pick up that job and do more things

A **trace** records all of that as one connected picture. You can see every step, how long each one took, and exactly how they're related.

Here's what a trace actually looks like:

```
POST /orders  [total: 412ms]
├── validate user token        [12ms]
├── fetch product from DB      [22ms]
├── check inventory level      [47ms]
├── calculate price with tax   [8ms]
├── write order to database    [31ms]
├── push payment job to queue  [12ms]
└── push notification to queue [9ms]
```

Each line is called a **span** — a single named operation with a start time and duration. They all share the same trace ID, so you know they belong together.

#### Quick Glossary

- **Trace** — the full journey of one request from start to finish
- **Span** — one specific operation within that journey
- **Trace ID** — a unique ID that ties all the spans together
- **Parent span** — the operation that triggered another (e.g., the HTTP request that triggered the DB query)

#### The Real Power: Following a Request Across Services

Here's where traces get really valuable. When a background worker picks up the payment job later, it can continue the same trace. So the full picture looks like:

```
POST /orders  [412ms]
└── payment-worker: process job  [1.8s]
    ├── call payment gateway     [1.7s]  ← here's your problem
    └── update order status      [40ms]
```

Without traces, you'd know something was slow. With traces, you know *exactly* what was slow and by how much — even across async boundaries that are invisible to logs and metrics.

---

## Why You Need All Three Together

Here's the thing: each pillar alone is useful, but none of them is enough on its own.

Metrics tell you something is wrong. They don't tell you why.  
Logs tell you what happened. They don't tell you where in the call chain it started.  
Traces show you the flow. They don't always show you the context and details.

When you combine all three around the same event, you get the full picture:

```
Step 1 — METRICS: alert fires
  "payment failure rate > 20% in the last 5 minutes"

Step 2 — TRACES: find the broken requests
  All failing orders have a payment-gateway span with status = TIMEOUT
  Duration: 2001ms — they're hitting the 2-second ceiling every time

Step 3 — LOGS: find out why
  Filter by that trace's correlationId
  "Payment gateway connection refused — attempt 3 of 3"
  "All retries exhausted. Marking order as payment_failed."

Root cause: the payment gateway API is unreachable
Impact: 47 orders failed in the last 5 minutes
```

Metrics caught it. Traces located it. Logs explained it. No SSH. No guessing. No "I'll have to look into it."

That's the goal.

---

## The LGTM Stack

Now let's talk about the tools. **LGTM** is an open-source observability stack where each letter stands for one tool, each designed for one signal type:

| Letter | Tool | What It Does | Query Language |
|--------|------|-------------|----------------|
| **L** | **Loki** | Stores and searches logs | LogQL |
| **G** | **Grafana** | Dashboards, alerts, and visualization | — |
| **T** | **Tempo** | Stores and searches distributed traces | TraceQL |
| **M** | **Mimir** | Stores metrics (Prometheus-compatible) | PromQL |

All four are open-source projects from Grafana Labs, and they're designed to talk to each other out of the box — especially inside Grafana.

On top of these four, there's one more piece that makes the whole thing work: the **OpenTelemetry Collector**. It sits between your application and the stack, receives all your telemetry, and routes it to the right place.

### Why This Stack Over Paid Alternatives?

There are great paid observability platforms — Datadog, New Relic, Dynatrace. They're excellent. But they come with trade-offs:

- **Cost** — at scale, these services can be surprisingly expensive
- **Vendor lock-in** — your instrumentation is tied to their SDK
- **Data control** — your logs and traces live on their servers

The LGTM stack gives you everything a paid platform does, completely self-hosted, with no per-seat or per-GB pricing. The trade-off is that you have to run it yourself. But with Docker Compose or Kubernetes, that's much easier than it sounds.

---

## Architecture: How It All Fits Together

Here's the full data flow from your application all the way to the dashboards:

```
┌──────────────────────────────────────────────────────────────┐
│                    Your Backend Application                  │
│                                                              │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   Logger    │  │ Metrics Client │  │   Tracing SDK    │  │
│  │ (structured │  │  (counters,    │  │  (auto + manual  │  │
│  │    JSON)    │  │  histograms)   │  │    spans)        │  │
│  └──────┬──────┘  └───────┬────────┘  └────────┬─────────┘  │
│         └─────────────────┴────────────────────┘            │
│                           │                                  │
│              OTLP (OpenTelemetry Protocol)                   │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  OpenTelemetry Collector                     │
│                                                              │
│  Receive → Process (batch, filter, enrich) → Export          │
│                                                              │
│    Logs    ────────────────────────────────► Loki            │
│    Metrics ────────────────────────────────► Mimir           │
│    Traces  ────────────────────────────────► Tempo           │
└──────────────────────────────────────────────────────────────┘
                │                  │                 │
                ▼                  ▼                 ▼
          ┌──────────┐      ┌──────────┐      ┌──────────┐
          │   Loki   │      │  Mimir   │      │  Tempo   │
          │  (Logs)  │      │(Metrics) │      │ (Traces) │
          │  LogQL   │      │  PromQL  │      │ TraceQL  │
          └────┬─────┘      └────┬─────┘      └────┬─────┘
               └────────────────┼─────────────────┘
                                │
                                ▼
               ┌─────────────────────────────┐
               │           Grafana            │
               │                             │
               │  Dashboards · Alerts        │
               │  Trace Explorer             │
               │  Log Explorer               │
               │  Cross-signal correlation   │
               └─────────────────────────────┘
```

The core idea here is **your application only talks to one place** — the Collector. It doesn't need to know about Loki, Mimir, or Tempo. The Collector handles the routing.

---

## OpenTelemetry: The Instrumentation Standard

Before getting into each LGTM component, there's one thing worth understanding first: **OpenTelemetry**.

OpenTelemetry (OTel for short) is an open-source framework that gives you a standard, vendor-neutral way to instrument your application. It was created by merging two earlier projects (OpenCensus and OpenTracing) and is now backed by the CNCF with adoption across pretty much every major company and cloud provider.

What does it actually give you?

- **APIs** — standard interfaces for emitting logs, metrics, and traces from your code
- **SDKs** — implementations for Node.js, Python, Java, Go, .NET, Ruby, and more
- **Auto-instrumentation** — it can automatically patch popular libraries with zero code changes
- **OTLP** — a standard wire protocol for sending telemetry data to any backend

**Instrument once, change backends freely.** Your instrumentation is permanent. Your backend is swappable.

### Auto-Instrumentation Is a Game Changer

One of my favourite things about OTel is auto-instrumentation. For most popular frameworks and libraries, OTel can automatically create spans and collect metrics without you writing a single line of tracing code:

| Library | What you get automatically |
|---------|---------------------------|
| HTTP server | Span for every incoming request, status code, duration |
| HTTP client | Span for every outgoing request with URL and status |
| PostgreSQL / MySQL | Span for every query with the SQL statement |
| Redis | Span for every command |
| Express / NestJS / FastAPI | Route handler spans, middleware spans |
| BullMQ / Kafka | Job processing spans |

For a typical backend, auto-instrumentation alone covers about 80% of what you need. You only add manual spans for the business logic that the framework can't see on its own.

---

## The OTel Collector: The Brain of the Pipeline

The **OpenTelemetry Collector** is a standalone service that receives all the telemetry from your application and routes it to the right storage backend.

```
Your App  ──OTLP──►  OTel Collector  ──────►  Loki / Tempo / Mimir
```

### Why Not Just Send Directly to Each Backend?

You could skip the Collector and have your app send logs directly to Loki, traces directly to Tempo, and metrics directly to Mimir. It would work. But you'd lose a lot.

With the Collector in the middle:

- Your app has one endpoint to worry about — the Collector handles the rest
- You can batch data before sending, which is much more efficient
- You can filter, sample, or transform data in one place without touching your app
- You can add backends, remove backends, or change routing without redeploying your service

It's a small operational overhead that pays for itself quickly.

### How the Collector Is Configured: Receivers → Processors → Exporters

The Collector works as a pipeline in three stages:

```
Receivers          Processors         Exporters
─────────          ──────────         ─────────
OTLP (gRPC)  ──►  Batch        ──►  Loki    (logs)
OTLP (HTTP)  ──►  Filter       ──►  Tempo   (traces)
Host Metrics ──►  Attributes   ──►  Mimir   (metrics)
```

**Receivers** are how data gets in. The `otlp` receiver accepts data from your app over gRPC or HTTP. There's also a `hostmetrics` receiver that automatically scrapes CPU, memory, disk, and network stats from the host machine — you get infrastructure metrics without writing a single line of application code.

**Processors** sit in the middle and can transform data before it goes out. The most common is `batch`, which groups records together for efficient transmission. You can also add processors to sample traces (so you don't store every single one), redact sensitive fields like passwords, or enrich data with extra metadata.

**Exporters** are how data gets out. Each backend has its own exporter configured with the right protocol — logs to Loki, metrics to Mimir, traces to Tempo.

---

## Loki: Log Aggregation

Loki is where your logs live. It's built by Grafana Labs with one guiding philosophy: **index labels, not log content**.

### What Makes Loki Different

If you've used Elasticsearch before, you're used to the idea that every word in every log line gets indexed. This makes searches very fast but also makes storage very expensive at scale. Indexing millions of log lines burns a lot of disk and RAM.

Loki takes a fundamentally different approach:

- It only indexes **labels** — a small set of key-value pairs like `service=payment-service, level=error`
- The actual log content is stored compressed and unindexed
- When you query by content, Loki scans only the compressed chunks that match your labels

The result? Loki is dramatically cheaper to operate than Elasticsearch, while still being fast enough for the most common queries you'll actually run.

### LogQL — Loki's Query Language

LogQL lets you filter logs by labels and content. For example, to find all error logs for a specific order:

```logql
{service="payment-service"} | json | orderId="ORD-12345"
```

### One Thing to Get Right: Label Cardinality

Good labels are **low cardinality** — `service`, `level`, `environment`. Never use `user_id` or `request_id` as labels. High-cardinality labels blow up Loki's index and kill performance. If you need to search by something unique like a correlation ID, put it in the log body — not as a label.

---

## Tempo: Distributed Tracing

Tempo is where your traces live. It's purpose-built for storing and querying distributed traces at high volume.

### How Tempo Stores Traces

Tempo is optimized for ingestion — it can take in a huge volume of spans without slowing down. Traces are stored as compressed blocks on disk. You can configure retention to control how long they're kept.

### Finding a Trace

The simplest way: paste a trace ID. When your app includes the trace ID in its response headers (which OTel does by default), you grab it, open Tempo in Grafana, and paste it in. You instantly see the full trace — every span, every timing, every attribute.

### TraceQL — Searching Traces Like a Pro

What if you don't have a specific trace ID? TraceQL lets you search by the shape and attributes of traces:

```traceql
# Find traces where the payment service had an error
{ span.service.name = "payment-service" && status = error }
```

This is incredibly useful for finding the outliers — the slow requests, the error-producing requests — without knowing their trace IDs in advance.

### Bonus: Automatic Metrics from Traces

Tempo has a built-in **metrics generator** that reads your trace data and automatically derives RED metrics (rate, error rate, duration) and writes them to Mimir. This means you get latency percentile graphs and error rates *for free*, derived directly from real trace data.

It also generates a **service graph** — a visual map of which services talk to which, built automatically from your spans. This is fantastic for understanding how your system is actually wired together, especially in larger architectures.

---

## Mimir: Metrics at Scale

Mimir is where your metrics live. It's a Prometheus-compatible metrics backend that's built to scale horizontally.

### Isn't Prometheus Enough?

Prometheus is great for getting started, and a lot of teams run it happily in production. But it has some real limitations as you grow:

- All storage is local — if the machine dies, your metrics history might go with it
- Long-term retention gets expensive because Prometheus keeps everything in memory-mapped files
- High-cardinality metrics (lots of unique label combinations) can push Prometheus to its memory limits

Mimir solves all of these with a distributed architecture. The best part? It's 100% PromQL compatible. Every query you've written for Prometheus works unchanged in Mimir. Every Grafana dashboard you've built works without modification.

### PromQL — Querying Metrics

PromQL is the query language for Prometheus-compatible metrics. Once you understand the `rate()` pattern, most of what you need falls naturally into place:

```promql
# 95th percentile response time
histogram_quantile(0.95, sum by (le) (rate(http_server_request_duration_bucket[5m])))
```

For infrastructure, the `hostmetrics` receiver in the OTel Collector automatically scrapes CPU, memory, disk, and network from the host — no application code needed:

```promql
# Host-level memory usage %
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

---

## Grafana: Connecting the Dots

Grafana is the front door to everything. It connects to Loki, Tempo, and Mimir as datasources and gives you one unified place to explore, visualize, and alert on all of your observability data.

But Grafana is more than just a dashboard tool. The feature that really sets it apart is **cross-signal correlation** — the ability to jump between signals with a single click.

### How Cross-Signal Correlation Works

When you configure Grafana's datasources properly, it links everything together:

- A log entry that contains a `traceId` gets a clickable button → click it, jump straight to that trace in Tempo
- A trace in Tempo has a "Logs" button → click it, Loki opens pre-filtered to that trace's time window and service
- Tempo's trace view can also show derived metrics from Mimir alongside the timeline

This sounds small. It's not. It means you can start your investigation anywhere — a metric alert, a slow trace, a single error log — and navigate to the full picture in three clicks.

### What a Real Investigation Looks Like in Grafana

Let me walk through the boss scenario from the beginning — but now with Grafana:

```
You arrive at work. Boss says: "API was slow yesterday at 2 PM."

Step 1 — Open Grafana, set time range to yesterday 2 PM - 3 PM
  → Metrics dashboard shows: response time spike to 4.2s starting at 14:07
  → Error rate: 0% — so nothing crashed, just slow

Step 2 — Switch to Traces, filter by time range, sort by duration
  → Top slow traces: all on GET /products
  → Open one — the DB query span is 3.8s out of 4.2s total

Step 3 — Click "Logs" on that trace
  → Loki opens, filtered to that trace's correlationId
  → "Slow query detected: 3821ms — SELECT * FROM products WHERE..."
  → "Auto-vacuum running on products table"

Root cause: PostgreSQL auto-vacuum ran during peak hours and locked the table.
Fix: Schedule auto-vacuum for off-peak hours.
```

You have graphs, traces, and logs. You have a root cause. You have a fix. Your boss is happy.

No SSH. No grepping. No guessing.

---

## Conclusion

Let me come back to where we started.

You walk into the office. Your boss asks what happened at 2 PM yesterday. Before, you had nothing. Now, you open Grafana, spend two minutes clicking through metrics → traces → logs, and you hand your boss a complete picture with a root cause and a fix.

That's the real value of observability. It's not about fancy tools or complex architectures. It's about making sure your system leaves a trail — so that when something goes wrong (and something always goes wrong), you can figure out what happened without being there when it happened.

The LGTM stack gives you everything you need to build that:

- **Loki** stores your logs efficiently and makes them searchable
- **Grafana** brings everything together in one UI with built-in signal correlation
- **Tempo** captures complete traces across every service and async worker
- **Mimir** stores your metrics at any scale with full Prometheus compatibility
- **OpenTelemetry** provides vendor-neutral instrumentation — instrument once, stay flexible forever

And here's the thing: you don't have to build all of this at once.

**Start with structured logs.** Add JSON formatting and a correlation ID to your requests. That alone will make debugging dramatically easier.

**Then add metrics.** Track the RED method — rate, errors, duration — for your most important endpoints. Set up an alert.

**Then add tracing.** Once you have logs and metrics, traces fill in the last gaps — showing you exactly what path each request took.

Each step builds on the last. Each step makes your system a little less of a black box. And once you've traced your first real production bug from alert to root cause in under 5 minutes, I promise you'll never want to go back to grepping log files at 2 AM.

---

*Stack versions: Loki 3.4.2 · Grafana 11.6.0 · Tempo 2.6.1 · Mimir 2.14.0 · OpenTelemetry Collector 0.120.0 · OpenTelemetry SDK 0.213.0*
