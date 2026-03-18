import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const logExporter = new OTLPLogExporter({
    url: `${otlpEndpoint}/v1/logs`,
});

const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
});

const metricExporter = new OTLPMetricExporter({
    url: `${otlpEndpoint}/v1/metrics`,
});

const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'lgtm-backend',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '0.0.1',
        'deployment.environment': process.env.MODE || 'DEV',
    }),
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 15000,
    }),
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    instrumentations: [
        new WinstonInstrumentation(),
        new HttpInstrumentation({
            ignoreIncomingRequestHook: (req) =>
                req.url === '/api/health' || req.url === '/api/health/ready',
        }),
        new ExpressInstrumentation(),
        new PgInstrumentation({
            enhancedDatabaseReporting: true,
        }),
        new IORedisInstrumentation(),
        new NestInstrumentation(),
    ],
});

sdk.start();

process.on('SIGTERM', () => {
    sdk.shutdown().then(
        () => console.log('OTel SDK shut down successfully'),
        (err) => console.error('Error shutting down OTel SDK', err),
    );
});
