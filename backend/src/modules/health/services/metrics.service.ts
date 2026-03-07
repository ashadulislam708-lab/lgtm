import { Injectable, OnModuleInit } from '@nestjs/common';
import {
    Registry,
    collectDefaultMetrics,
    Counter,
    Histogram,
    Gauge,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
    private readonly registry: Registry;

    readonly httpRequestsTotal: Counter;
    readonly httpRequestDurationSeconds: Histogram;
    readonly httpRequestErrorsTotal: Counter;
    readonly orderflowOrdersPlacedTotal: Counter;
    readonly orderflowPaymentsProcessedTotal: Counter;
    readonly orderflowActiveUsers: Gauge;

    constructor() {
        this.registry = new Registry();

        this.httpRequestsTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'path', 'status_code'] as const,
            registers: [this.registry],
        });

        this.httpRequestDurationSeconds = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'path', 'status_code'] as const,
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry],
        });

        this.httpRequestErrorsTotal = new Counter({
            name: 'http_request_errors_total',
            help: 'Total number of HTTP request errors',
            labelNames: ['method', 'path', 'error_type'] as const,
            registers: [this.registry],
        });

        this.orderflowOrdersPlacedTotal = new Counter({
            name: 'orderflow_orders_placed_total',
            help: 'Total number of orders placed',
            registers: [this.registry],
        });

        this.orderflowPaymentsProcessedTotal = new Counter({
            name: 'orderflow_payments_processed_total',
            help: 'Total number of payments processed',
            labelNames: ['status'] as const,
            registers: [this.registry],
        });

        this.orderflowActiveUsers = new Gauge({
            name: 'orderflow_active_users',
            help: 'Number of currently active users',
            registers: [this.registry],
        });
    }

    onModuleInit(): void {
        collectDefaultMetrics({ register: this.registry });
    }

    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    getContentType(): string {
        return this.registry.contentType;
    }
}
