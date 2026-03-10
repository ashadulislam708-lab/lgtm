import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatusEnum } from '@shared/enums/order-status.enum';

export class UpdateOrderStatusDto {
    @ApiProperty({
        enum: OrderStatusEnum,
        example: OrderStatusEnum.CONFIRMED,
        description: 'New order status',
    })
    @IsEnum(OrderStatusEnum)
    status: OrderStatusEnum;
}
