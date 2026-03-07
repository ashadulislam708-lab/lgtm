import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '@modules/health/services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const path = this.normalizePath(request.route?.path || request.url);
        const startTime = process.hrtime.bigint();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = String(response.statusCode);
                    const duration = this.getDurationInSeconds(startTime);

                    this.metricsService.httpRequestsTotal
                        .labels(method, path, statusCode)
                        .inc();
                    this.metricsService.httpRequestDurationSeconds
                        .labels(method, path, statusCode)
                        .observe(duration);
                },
                error: (error) => {
                    const statusCode = String(error.status || 500);
                    const errorType = error.constructor?.name || 'UnknownError';
                    const duration = this.getDurationInSeconds(startTime);

                    this.metricsService.httpRequestsTotal
                        .labels(method, path, statusCode)
                        .inc();
                    this.metricsService.httpRequestDurationSeconds
                        .labels(method, path, statusCode)
                        .observe(duration);
                    this.metricsService.httpRequestErrorsTotal
                        .labels(method, path, errorType)
                        .inc();
                },
            }),
        );
    }

    private normalizePath(path: string): string {
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id')
            .replace(/\?.*$/, '');
    }

    private getDurationInSeconds(startTime: bigint): number {
        const endTime = process.hrtime.bigint();
        return Number(endTime - startTime) / 1e9;
    }
}
