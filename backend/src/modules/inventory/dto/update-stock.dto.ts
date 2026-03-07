import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
    @ApiProperty({
        example: 50,
        description: 'New stock quantity',
        minimum: 0,
    })
    @IsInt()
    @Min(0)
    stockQuantity: number;
}
