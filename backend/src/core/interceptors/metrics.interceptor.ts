import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from '@infrastructure/telemetry/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, route } = request;
        const routePath = route?.path || request.url;
        const now = Date.now();

        this.metricsService.httpRequestTotal.add(1, {
            'http.method': method,
            'http.route': routePath,
        });

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - now;
                const statusCode = context
                    .switchToHttp()
                    .getResponse().statusCode;
                this.metricsService.httpRequestDuration.record(duration, {
                    'http.method': method,
                    'http.route': routePath,
                    'http.status_code': statusCode,
                });
            }),
            catchError((error) => {
                const duration = Date.now() - now;
                const status = error?.status || 500;
                this.metricsService.httpErrorTotal.add(1, {
                    'http.method': method,
                    'http.route': routePath,
                    'http.status_code': status,
                });
                this.metricsService.httpRequestDuration.record(duration, {
                    'http.method': method,
                    'http.route': routePath,
                    'http.status_code': status,
                });
                return throwError(() => error);
            }),
        );
    }
}
