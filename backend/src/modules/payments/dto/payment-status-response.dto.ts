import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentStatusResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Order ID',
    })
    orderId: string;

    @ApiProperty({
        example: 'paid',
        description: 'Current payment status',
    })
    status: string;

    @ApiProperty({
        example: 1,
        description: 'Number of payment attempts',
    })
    attempts: number;

    @ApiPropertyOptional({
        example: 'Payment declined',
        description: 'Last error message if payment failed',
    })
    lastError: string | null;
}
