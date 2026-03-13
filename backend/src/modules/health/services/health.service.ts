import { Injectable } from '@nestjs/common';
import {
    HealthCheckService,
    HealthCheckResult,
    TypeOrmHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db: TypeOrmHealthIndicator,
        private readonly memory: MemoryHealthIndicator,
        private readonly disk: DiskHealthIndicator,
    ) {}

    async check(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
            () =>
                this.disk.checkStorage('disk', {
                    thresholdPercent: 0.9,
                    path: '/',
                }),
        ]);
    }

    async checkReadiness(): Promise<HealthCheckResult> {
        return this.health.check([() => this.db.pingCheck('database')]);
    }

    checkLiveness(): { status: string } {
        return { status: 'ok' };
    }
}
