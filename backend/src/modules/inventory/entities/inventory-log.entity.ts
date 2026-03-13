import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@core/base';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventorySourceEnum } from '@shared/enums/inventory-source.enum';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory_logs')
@Index(['productId'])
@Index(['source'])
@Index(['syncCorrelationId'])
export class InventoryLog extends BaseEntity {
    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'Product ID',
    })
    @Column({ type: 'uuid' })
    productId: string;

    @ApiProperty({
        example: 50,
        description: 'Previous stock quantity before change',
    })
    @Column({ type: 'int' })
    previousQuantity: number;

    @ApiProperty({
        example: 45,
        description: 'New stock quantity after change',
    })
    @Column({ type: 'int' })
    newQuantity: number;

    @ApiProperty({
        example: InventorySourceEnum.SYNC,
        description: 'Source of the inventory change',
        enum: InventorySourceEnum,
    })
    @Column({
        type: 'enum',
        enum: InventorySourceEnum,
    })
    source: InventorySourceEnum;

    @ApiPropertyOptional({
        example: -5,
        description:
            'Discrepancy between expected and actual quantity during sync',
    })
    @Column({ type: 'int', nullable: true })
    discrepancy?: number;

    @ApiPropertyOptional({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'Correlation ID linking all logs from one sync operation',
    })
    @Column({ type: 'uuid', nullable: true })
    syncCorrelationId?: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;
}
