import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@core/decorators/public.decorator';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Health')
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'Prometheus metrics' })
    @ApiOkResponse({ description: 'Prometheus format metrics' })
    async getMetrics(@Res() response: Response): Promise<void> {
        const metrics = await this.metricsService.getMetrics();
        response.set('Content-Type', this.metricsService.getContentType());
        response.send(metrics);
    }
}
