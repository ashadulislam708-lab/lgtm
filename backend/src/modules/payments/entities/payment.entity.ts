import {
    Entity,
    Column,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '@modules/orders/entities/order.entity';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';

@Entity('payments')
@Index(['orderId'])
@Index(['status'])
@Index(['correlationId'])
export class Payment extends BaseEntity {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Order ID this payment belongs to',
    })
    @Column({ name: 'order_id', type: 'uuid' })
    orderId: string;

    @ApiProperty({
        example: 109.99,
        description: 'Payment amount',
    })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ApiProperty({
        enum: PaymentStatusEnum,
        example: PaymentStatusEnum.PENDING,
        description: 'Payment status',
    })
    @Column({
        type: 'enum',
        enum: PaymentStatusEnum,
        default: PaymentStatusEnum.PENDING,
    })
    status: PaymentStatusEnum;

    @ApiPropertyOptional({
        description: 'Gateway response data',
    })
    @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
    gatewayResponse: Record<string, any> | null;

    @ApiProperty({
        example: 1,
        description: 'Payment attempt number',
    })
    @Column({ name: 'attempt_number', type: 'int', default: 1 })
    attemptNumber: number;

    @ApiPropertyOptional({
        example: 'Payment declined',
        description: 'Error message if payment failed',
    })
    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string | null;

    @ApiPropertyOptional({
        example: 1500,
        description: 'Processing time in milliseconds',
    })
    @Column({
        name: 'processing_time',
        type: 'int',
        nullable: true,
        comment: 'Processing time in milliseconds',
    })
    processingTime: number | null;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Correlation ID for distributed tracing',
    })
    @Column({ name: 'correlation_id', type: 'uuid' })
    correlationId: string;

    // Relations
    @ManyToOne(() => Order, (order) => order.payments)
    @JoinColumn({ name: 'order_id' })
    order: Order;
}
