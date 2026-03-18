import { Injectable, OnModuleInit } from '@nestjs/common';
import {
    metrics,
    Meter,
    Counter,
    Histogram,
    UpDownCounter,
} from '@opentelemetry/api';

@Injectable()
export class MetricsService implements OnModuleInit {
    private meter: Meter;

    // HTTP metrics
    public httpRequestDuration: Histogram;
    public httpRequestTotal: Counter;
    public httpErrorTotal: Counter;

    // Business metrics - Orders
    public ordersCreatedTotal: Counter;
    public ordersByStatusTotal: Counter;
    public orderAmountHistogram: Histogram;

    // Business metrics - Payments
    public paymentAttemptsTotal: Counter;
    public paymentSuccessTotal: Counter;
    public paymentFailureTotal: Counter;
    public paymentDuration: Histogram;

    // Queue metrics
    public queueJobsActive: UpDownCounter;
    public queueJobsCompleted: Counter;
    public queueJobsFailed: Counter;
    public queueJobDuration: Histogram;

    onModuleInit() {
        this.meter = metrics.getMeter('lgtm-backend');

        this.httpRequestDuration = this.meter.createHistogram(
            'http.server.request.duration',
            {
                description: 'HTTP request duration in milliseconds',
                unit: 'ms',
            },
        );

        this.httpRequestTotal = this.meter.createCounter(
            'http.server.request.total',
            {
                description: 'Total number of HTTP requests',
            },
        );

        this.httpErrorTotal = this.meter.createCounter(
            'http.server.error.total',
            {
                description: 'Total number of HTTP errors',
            },
        );

        this.ordersCreatedTotal = this.meter.createCounter(
            'business.orders.created.total',
            {
                description: 'Total orders placed',
            },
        );

        this.ordersByStatusTotal = this.meter.createCounter(
            'business.orders.status.total',
            {
                description: 'Order status transitions',
            },
        );

        this.orderAmountHistogram = this.meter.createHistogram(
            'business.orders.amount',
            {
                description: 'Order total amount distribution',
                unit: 'KRW',
            },
        );

        this.paymentAttemptsTotal = this.meter.createCounter(
            'business.payments.attempts.total',
            {
                description: 'Total payment processing attempts',
            },
        );

        this.paymentSuccessTotal = this.meter.createCounter(
            'business.payments.success.total',
            {
                description: 'Successful payment count',
            },
        );

        this.paymentFailureTotal = this.meter.createCounter(
            'business.payments.failure.total',
            {
                description: 'Failed payment count',
            },
        );

        this.paymentDuration = this.meter.createHistogram(
            'business.payments.duration',
            {
                description: 'Payment gateway processing time in milliseconds',
                unit: 'ms',
            },
        );

        this.queueJobsActive = this.meter.createUpDownCounter(
            'queue.jobs.active',
            {
                description: 'Currently active queue jobs',
            },
        );

        this.queueJobsCompleted = this.meter.createCounter(
            'queue.jobs.completed.total',
            {
                description: 'Total completed queue jobs',
            },
        );

        this.queueJobsFailed = this.meter.createCounter(
            'queue.jobs.failed.total',
            {
                description: 'Total failed queue jobs',
            },
        );

        this.queueJobDuration = this.meter.createHistogram(
            'queue.jobs.duration',
            {
                description: 'Queue job processing duration',
                unit: 'ms',
            },
        );
    }
}
