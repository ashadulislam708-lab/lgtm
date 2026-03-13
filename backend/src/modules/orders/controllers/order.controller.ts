import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { CurrentUser } from '@core/decorators/current-user.decorator';
import { RolesEnum } from '@shared/enums/role.enum';

import {
    CreatedResponseDto,
    SuccessResponseDto,
    UpdatedResponseDto,
    PaginatedResponseDto,
} from '@shared/dtos/response.dto';
import { Order } from '../entities/order.entity';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderFilterDto } from '../dto/order-filter.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    /**
     * Place a new order
     * Access: Authenticated customers
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Order',
        operation: 'create',
        requestDto: CreateOrderDto,
        responseDto: Order,
        successStatus: 201,
        requiresAuth: true,
    })
    async placeOrder(
        @CurrentUser('id') userId: string | undefined,
        @Body() createOrderDto: CreateOrderDto,
    ): Promise<CreatedResponseDto<Order>> {
        const order = await this.orderService.placeOrder(
            userId || 'anonymous',
            createOrderDto,
        );
        return new CreatedResponseDto(order, 'Order placed successfully');
    }

    /**
     * List orders
     * Access: Customer (own orders) / Admin (all orders)
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Orders',
        operation: 'getAll',
        responseDto: Order,
        isArray: true,
        requiresAuth: true,
        withPagination: true,
    })
    async getOrders(
        @CurrentUser('id') userId: string | undefined,
        @CurrentUser('role') role: RolesEnum | undefined,
        @Query() filterDto: OrderFilterDto,
    ): Promise<PaginatedResponseDto<Order>> {
        const { data, total } = await this.orderService.getOrders(
            userId || '',
            role ?? RolesEnum.ADMIN,
            filterDto,
        );
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;

        return new PaginatedResponseDto(data, page, limit, total);
    }

    /**
     * Get order details with items
     * Access: Customer (own order) / Admin (any order)
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Order',
        operation: 'getOne',
        responseDto: Order,
        requiresAuth: true,
    })
    async getOrderById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string | undefined,
        @CurrentUser('role') role: RolesEnum | undefined,
    ): Promise<SuccessResponseDto<Order>> {
        const order = await this.orderService.getOrderById(
            id,
            userId || '',
            role ?? RolesEnum.ADMIN,
        );
        return new SuccessResponseDto(order, 'Order retrieved successfully');
    }

    /**
     * Update order status
     * Access: Admin only
     */
    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Order Status',
        operation: 'update',
        requestDto: UpdateOrderStatusDto,
        responseDto: Order,
        requiresAuth: true,
    })
    async updateOrderStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
    ): Promise<UpdatedResponseDto<Order>> {
        const order = await this.orderService.updateOrderStatus(
            id,
            updateStatusDto,
        );
        return new UpdatedResponseDto(
            order,
            'Order status updated successfully',
        );
    }
}
