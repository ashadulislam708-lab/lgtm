import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProcessPaymentDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Order ID to process payment for',
    })
    @IsUUID()
    orderId: string;
}
