import { IsOptional, IsEnum, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dtos/pagination.dto.js';
import { OrderStatusEnum } from '@shared/enums/order-status.enum.js';

export class OrderFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        enum: OrderStatusEnum,
        example: OrderStatusEnum.PENDING,
        description: 'Filter by order status',
    })
    @IsEnum(OrderStatusEnum)
    @IsOptional()
    status?: OrderStatusEnum;

    @ApiPropertyOptional({
        example: '2026-01-01',
        description: 'Filter orders created from this date',
    })
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional({
        example: '2026-12-31',
        description: 'Filter orders created up to this date',
    })
    @IsString()
    @IsOptional()
    dateTo?: string;

    @ApiPropertyOptional({
        example: 'createdAt',
        description: 'Sort field',
        enum: ['createdAt', 'totalAmount', 'status'],
    })
    @IsString()
    @IsIn(['createdAt', 'totalAmount', 'status'])
    @IsOptional()
    declare sortBy?: string;

    @ApiPropertyOptional({
        example: 'DESC',
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
    })
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    declare sortOrder?: 'ASC' | 'DESC';
}
