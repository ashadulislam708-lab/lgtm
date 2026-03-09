import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dtos';

export class ProductFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        example: 'headphones',
        description: 'Search by name or description',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        example: 'Electronics',
        description: 'Filter by category',
    })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({
        example: 10,
        description: 'Minimum price filter',
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    priceMin?: number;

    @ApiPropertyOptional({
        example: 500,
        description: 'Maximum price filter',
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    priceMax?: number;

    @ApiPropertyOptional({
        example: 'price',
        description: 'Sort field',
        enum: ['name', 'price', 'createdAt'],
    })
    @IsString()
    @IsIn(['name', 'price', 'createdAt'])
    @IsOptional()
    declare sortBy?: string;

    @ApiPropertyOptional({
        example: 'ASC',
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
    })
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    declare sortOrder?: 'ASC' | 'DESC';
}
