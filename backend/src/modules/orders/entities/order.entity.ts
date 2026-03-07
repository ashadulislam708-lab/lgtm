import {
    Entity,
    Column,
    Index,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@modules/users/user.entity.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatusEnum } from '@shared/enums/order-status.enum.js';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum.js';
import { Payment } from '@modules/payments/entities/payment.entity.js';

@Entity('orders')
@Index(['trackingId'], { unique: true })
@Index(['userId'])
@Index(['status'])
@Index(['correlationId'])
export class Order extends BaseEntity {
    @ApiProperty({
        example: 'ORD-A1B2C3',
        description: 'Unique tracking ID for the order',
    })
    @Column({ name: 'tracking_id', unique: true, length: 255 })
    trackingId: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'User ID who placed the order',
    })
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ApiProperty({
        enum: OrderStatusEnum,
        example: OrderStatusEnum.PENDING,
        description: 'Current order status',
    })
    @Column({
        type: 'enum',
        enum: OrderStatusEnum,
        default: OrderStatusEnum.PENDING,
    })
    status: OrderStatusEnum;

    @ApiProperty({
        example: 109.99,
        description: 'Total order amount including tax',
    })
    @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @ApiProperty({
        example: 10.0,
        description: 'Tax amount',
    })
    @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2 })
    taxAmount: number;

    @ApiPropertyOptional({
        example: '123 Main St, City, Country',
        description: 'Shipping address',
    })
    @Column({ name: 'shipping_address', type: 'text', nullable: true })
    shippingAddress?: string;

    @ApiProperty({
        enum: PaymentStatusEnum,
        example: PaymentStatusEnum.PENDING,
        description: 'Payment status',
    })
    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatusEnum,
        default: PaymentStatusEnum.PENDING,
    })
    paymentStatus: PaymentStatusEnum;

    @ApiProperty({
        example: 0,
        description: 'Number of payment attempts',
    })
    @Column({ name: 'payment_attempts', type: 'int', default: 0 })
    paymentAttempts: number;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Correlation ID for distributed tracing',
    })
    @Column({ name: 'correlation_id', type: 'uuid' })
    correlationId: string;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => Payment, (payment) => payment.order)
    payments: Payment[];
}
