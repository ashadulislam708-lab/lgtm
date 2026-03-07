import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@core/base';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('products')
@Index(['category'])
@Index(['sku'], { unique: true })
@Index(['name'])
export class Product extends BaseEntity {
    @ApiProperty({
        example: 'Wireless Bluetooth Headphones',
        description: 'Product name',
        maxLength: 255,
    })
    @Column({ length: 255 })
    name: string;

    @ApiPropertyOptional({
        example: 'High-quality wireless headphones with noise cancellation',
        description: 'Product description',
    })
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({
        example: 49.99,
        description: 'Product price',
        minimum: 0,
    })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ApiProperty({
        example: 'Electronics',
        description: 'Product category',
    })
    @Column({ length: 255 })
    category: string;

    @ApiProperty({
        example: 'SKU-WBH-001',
        description: 'Unique stock keeping unit',
    })
    @Column({ unique: true, length: 255 })
    sku: string;

    @ApiProperty({
        example: 100,
        description: 'Available stock quantity',
        minimum: 0,
    })
    @Column({ type: 'int', default: 0 })
    stockQuantity: number;

    @ApiPropertyOptional({
        example: 'https://example.com/images/product.jpg',
        description: 'Product image URL',
    })
    @Column({ nullable: true, length: 2048 })
    imageUrl?: string;

    @ApiProperty({
        example: true,
        description: 'Whether the product is active and visible',
    })
    @Column({ default: true })
    isActive: boolean;
}
