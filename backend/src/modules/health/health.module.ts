import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthService } from './services/health.service';
import { MetricsService } from './services/metrics.service';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController, MetricsController],
    providers: [HealthService, MetricsService],
    exports: [MetricsService],
})
export class HealthModule {}
