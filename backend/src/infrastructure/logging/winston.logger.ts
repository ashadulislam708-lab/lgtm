import { createLogger, format, transports } from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import { existsSync, mkdirSync } from 'fs';
import { getCorrelationId } from './correlation.storage';

if (!existsSync('logs')) {
    mkdirSync('logs');
}

const serviceName = process.env.OTEL_SERVICE_NAME || 'lgtm-backend';
const isDevMode = process.env.MODE === 'DEV';

const correlationIdFormat = format((info) => {
    const correlationId = getCorrelationId();
    if (correlationId) {
        info.correlationId = correlationId;
    }
    return info;
});

const structuredFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    correlationIdFormat(),
    format.json(),
);

const devConsoleFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    correlationIdFormat(),
    format.colorize(),
    format.printf((info) => {
        const ctx = info['context'] ? `[${info['context'] as string}]` : '';
        const cid = info['correlationId']
            ? `[${info['correlationId'] as string}]`
            : '';
        return `${info.timestamp} ${info.level} ${ctx}${cid} ${info.message}`;
    }),
);

const loggerInstance = createLogger({
    level: isDevMode ? 'debug' : 'info',
    defaultMeta: {
        service: serviceName,
        environment: process.env.MODE || 'DEV',
    },
    transports: [
        new transports.Console({
            format: isDevMode ? devConsoleFormat : structuredFormat,
        }),
        ...(isDevMode
            ? []
            : [
                  new transports.File({
                      filename: 'logs/error.log',
                      level: 'error',
                      format: structuredFormat,
                  }),
                  new transports.File({
                      filename: 'logs/combine.log',
                      level: 'info',
                      format: structuredFormat,
                  }),
              ]),
        ...(process.env.OTEL_EXPORTER_OTLP_ENDPOINT
            ? [new OpenTelemetryTransportV3()]
            : []),
    ],
});

export const instance = loggerInstance;
