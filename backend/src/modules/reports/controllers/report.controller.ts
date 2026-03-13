import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { SuccessResponseDto } from '@shared/dtos/response.dto';
import { ReportService } from '../services/report.service';
import { GenerateReportDto } from '../dto/generate-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    /**
     * Generate a report (inline for small ranges, async for large)
     * Access: Admin only
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Report',
        operation: 'custom',
        summary: 'Generate a report (sales, orders, or inventory)',
        requestDto: GenerateReportDto,
        requiresAuth: true,
    })
    async generateReport(
        @Body() dto: GenerateReportDto,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.reportService.generateReport(dto);
        return new SuccessResponseDto(result, result.message);
    }

    /**
     * Get report status and result by job ID
     * Access: Admin only
     */
    @Get(':jobId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Report Status',
        operation: 'custom',
        summary: 'Get report generation status and result',
        requiresAuth: true,
    })
    async getReportStatus(
        @Param('jobId') jobId: string,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.reportService.getReportStatus(jobId);
        return new SuccessResponseDto(result, result.message);
    }
}
