import { Injectable } from '@nestjs/common';
import { trace, context, Span, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class TelemetryService {
    private readonly tracer = trace.getTracer('orderflow');

    startSpan(
        name: string,
        attributes?: Record<string, string>,
    ): Span {
        const span = this.tracer.startSpan(name);
        if (attributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                span.setAttribute(key, value);
            });
        }
        return span;
    }

    addAttribute(span: Span, key: string, value: string): void {
        span.setAttribute(key, value);
    }

    recordException(span: Span, error: Error): void {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }

    endSpan(span: Span): void {
        span.end();
    }

    getActiveSpan(): Span | undefined {
        return trace.getSpan(context.active());
    }

    addCorrelationId(correlationId: string): void {
        const span = this.getActiveSpan();
        if (span) {
            span.setAttribute('correlation.id', correlationId);
        }
    }
}
