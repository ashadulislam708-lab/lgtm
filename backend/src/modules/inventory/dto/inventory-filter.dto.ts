import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dtos';

export class InventoryFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        example: true,
        description: 'Filter products with low stock (stockQuantity < 10)',
    })
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    lowStock?: boolean;

    @ApiPropertyOptional({
        example: 'Electronics',
        description: 'Filter by product category',
    })
    @IsString()
    @IsOptional()
    category?: string;
}
