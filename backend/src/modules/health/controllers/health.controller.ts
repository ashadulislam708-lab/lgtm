import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@core/decorators/public.decorator';
import { HealthService } from '../services/health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @Public()
    @HealthCheck()
    @ApiOperation({ summary: 'Overall health status' })
    @ApiOkResponse({ description: 'Health check results' })
    async check(): Promise<HealthCheckResult> {
        return this.healthService.check();
    }

    @Get('ready')
    @Public()
    @HealthCheck()
    @ApiOperation({ summary: 'Kubernetes readiness probe' })
    @ApiOkResponse({ description: 'Readiness check results' })
    async checkReadiness(): Promise<HealthCheckResult> {
        return this.healthService.checkReadiness();
    }

    @Get('live')
    @Public()
    @ApiOperation({ summary: 'Kubernetes liveness probe' })
    @ApiOkResponse({ description: 'Liveness check result' })
    checkLiveness(): { status: string } {
        return this.healthService.checkLiveness();
    }
}
