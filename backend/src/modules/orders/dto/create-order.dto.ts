import {
    IsArray,
    IsOptional,
    IsString,
    IsUUID,
    IsInt,
    Min,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Product ID to order',
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 2,
        description: 'Quantity to order',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({
        type: [OrderItemDto],
        description: 'List of items to order',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    @ArrayMinSize(1)
    items: OrderItemDto[];

    @ApiPropertyOptional({
        example: '123 Main St, City, Country',
        description: 'Shipping address',
    })
    @IsOptional()
    @IsString()
    shippingAddress?: string;
}
