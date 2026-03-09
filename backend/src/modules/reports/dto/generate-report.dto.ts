import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum ReportTypeEnum {
    SALES = 'sales',
    ORDERS = 'orders',
    INVENTORY = 'inventory',
}

export enum ReportFormatEnum {
    JSON = 'json',
    CSV = 'csv',
}

export class GenerateReportDto {
    @ApiProperty({
        enum: ReportTypeEnum,
        example: ReportTypeEnum.SALES,
        description: 'Type of report to generate',
    })
    @IsEnum(ReportTypeEnum)
    type: ReportTypeEnum;

    @ApiProperty({
        example: '2026-01-01',
        description: 'Start date for the report range',
    })
    @IsDateString()
    dateFrom: string;

    @ApiProperty({
        example: '2026-03-07',
        description: 'End date for the report range',
    })
    @IsDateString()
    dateTo: string;

    @ApiPropertyOptional({
        enum: ReportFormatEnum,
        example: ReportFormatEnum.JSON,
        description: 'Output format (default: json)',
    })
    @IsOptional()
    @IsEnum(ReportFormatEnum)
    format?: ReportFormatEnum;
}
