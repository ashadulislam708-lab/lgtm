import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsInt,
    IsOptional,
    IsUrl,
    IsBoolean,
    Min,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({
        example: 'Wireless Bluetooth Headphones',
        description: 'Product name',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({
        example: 'High-quality wireless headphones with noise cancellation',
        description: 'Product description',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: 49.99,
        description: 'Product price',
        minimum: 0,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;

    @ApiProperty({
        example: 'Electronics',
        description: 'Product category',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    category: string;

    @ApiProperty({
        example: 'SKU-WBH-001',
        description: 'Unique stock keeping unit',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    sku: string;

    @ApiPropertyOptional({
        example: 100,
        description: 'Available stock quantity',
        minimum: 0,
        default: 0,
    })
    @IsInt()
    @Min(0)
    @IsOptional()
    stockQuantity?: number = 0;

    @ApiPropertyOptional({
        example: 'https://example.com/images/product.jpg',
        description: 'Product image URL',
    })
    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the product is active',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
}
