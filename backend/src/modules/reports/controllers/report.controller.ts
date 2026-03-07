import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator.js';
import { Roles } from '@core/decorators/roles.decorator.js';
import { RolesGuard } from '@core/guards/roles.guard.js';
import { RolesEnum } from '@shared/enums/role.enum.js';
import { SuccessResponseDto } from '@shared/dtos/response.dto.js';
import { ReportService } from '../services/report.service.js';
import { GenerateReportDto } from '../dto/generate-report.dto.js';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    /**
     * Generate a report (inline for small ranges, async for large)
     * Access: Admin only
     */
    @Post()
    @Roles(RolesEnum.ADMIN)
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
    @Roles(RolesEnum.ADMIN)
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
