import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { Product } from '@modules/products/entities/product.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Order ID this item belongs to',
    })
    @Column({ name: 'order_id', type: 'uuid' })
    orderId: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Product ID',
    })
    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @ApiProperty({
        example: 2,
        description: 'Quantity ordered',
    })
    @Column({ type: 'int' })
    quantity: number;

    @ApiProperty({
        example: 49.99,
        description: 'Unit price at time of order',
    })
    @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @ApiProperty({
        example: 99.98,
        description: 'Total price (quantity * unitPrice)',
    })
    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    // Relations
    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;
}
