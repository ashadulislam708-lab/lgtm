import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';

const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const logExporter = new OTLPLogExporter({
    url: `${otlpEndpoint}/v1/logs`,
});

const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]:
            process.env.OTEL_SERVICE_NAME || 'lgtm-backend',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '0.0.1',
        'deployment.environment': process.env.MODE || 'DEV',
    }),
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    instrumentations: [new WinstonInstrumentation()],
});

sdk.start();

process.on('SIGTERM', () => {
    sdk.shutdown().then(
        () => console.log('OTel SDK shut down successfully'),
        (err) => console.error('Error shutting down OTel SDK', err),
    );
});
