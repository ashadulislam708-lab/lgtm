import {
    Injectable,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { BaseService } from '@core/base/base.service';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { ProductService } from '@modules/products/services/product.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderFilterDto } from '../dto/order-filter.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderStatusEnum } from '@shared/enums/order-status.enum';
import { RolesEnum } from '@shared/enums/role.enum';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { Product } from '@modules/products/entities/product.entity';

@Injectable()
export class OrderService extends BaseService<Order> {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly orderItemRepository: OrderItemRepository,
        private readonly productService: ProductService,
        private readonly i18nHelper: I18nHelper,
        private readonly dataSource: DataSource,
        @InjectQueue(QUEUE_NAMES.PAYMENT_PROCESSING)
        private readonly paymentQueue: Queue,
        @InjectQueue(QUEUE_NAMES.NOTIFICATION)
        private readonly notificationQueue: Queue,
    ) {
        super(orderRepository, 'Order');
    }

    /**
     * Place a new order with multi-step validation and transaction
     */
    async placeOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
        const correlationId = randomUUID();

        // Step 1: Validate all products exist and have sufficient stock
        const productMap = new Map<string, Product>();
        for (const item of dto.items) {
            const product = await this.productService.findByIdOrFail(item.productId);
            const stockCheck = await this.productService.checkStock(
                item.productId,
                item.quantity,
            );
            if (!stockCheck.available) {
                throw new BadRequestException(
                    this.i18nHelper.t('translation.orders.error.insufficient_stock', {
                        product: product.name,
                        available: stockCheck.currentStock,
                        requested: item.quantity,
                    }),
                );
            }
            productMap.set(item.productId, product);
        }

        // Step 2: Calculate totals
        let subtotal = 0;
        for (const item of dto.items) {
            const product = productMap.get(item.productId)!;
            subtotal += item.quantity * Number(product.price);
        }
        const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        // Step 3: Generate tracking ID
        const trackingId = 'ORD-' + randomUUID().substring(0, 6).toUpperCase();

        // Step 4: Execute transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let savedOrder: Order;

        try {
            // Create order
            const order = queryRunner.manager.create(Order, {
                trackingId,
                userId,
                status: OrderStatusEnum.PENDING,
                totalAmount,
                taxAmount,
                shippingAddress: dto.shippingAddress,
                paymentStatus: PaymentStatusEnum.PENDING,
                paymentAttempts: 0,
                correlationId,
            });
            savedOrder = await queryRunner.manager.save(Order, order);

            // Create order items
            const orderItems: OrderItem[] = [];
            for (const item of dto.items) {
                const product = productMap.get(item.productId)!;
                const unitPrice = Number(product.price);
                const totalPrice = Math.round(item.quantity * unitPrice * 100) / 100;

                const orderItem = queryRunner.manager.create(OrderItem, {
                    orderId: savedOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice,
                });
                orderItems.push(orderItem);
            }
            await queryRunner.manager.save(OrderItem, orderItems);

            // Deduct stock from each product
            for (const item of dto.items) {
                const product = productMap.get(item.productId)!;
                await queryRunner.manager.update(Product, product.id, {
                    stockQuantity: product.stockQuantity - item.quantity,
                });
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        // Step 5: Enqueue payment processing job (after commit)
        await this.paymentQueue.add('process-payment', {
            orderId: savedOrder.id,
            amount: totalAmount,
            correlationId,
        });

        // Step 6: Enqueue notification job (after commit)
        await this.notificationQueue.add('send-notification', {
            userId,
            type: 'order_placed',
            title: 'Order Placed',
            message: `Order ${trackingId} placed`,
            metadata: {
                orderId: savedOrder.id,
                trackingId,
                amount: totalAmount,
            },
        });

        // Return order with items loaded
        const result = await this.orderRepository.findWithItems(savedOrder.id);
        return result!;
    }

    /**
     * Get orders with filters based on user role
     */
    async getOrders(
        userId: string,
        role: RolesEnum,
        filterDto: OrderFilterDto,
    ): Promise<{ data: Order[]; total: number }> {
        return this.orderRepository.findWithFilters(userId, role, filterDto);
    }

    /**
     * Get order by ID with ownership check for non-admin users
     */
    async getOrderById(
        id: string,
        userId: string,
        role: RolesEnum,
    ): Promise<Order> {
        const order = await this.orderRepository.findWithItems(id);
        if (!order) {
            throw new BadRequestException(
                this.i18nHelper.t('translation.orders.error.not_found', {
                    id,
                }),
            );
        }

        // Non-admin users can only view their own orders
        if (role !== RolesEnum.ADMIN && order.userId !== userId) {
            throw new ForbiddenException(
                this.i18nHelper.t('translation.orders.error.forbidden'),
            );
        }

        return order;
    }

    /**
     * Update order status (admin only)
     */
    async updateOrderStatus(
        id: string,
        dto: UpdateOrderStatusDto,
    ): Promise<Order> {
        const order = await this.findByIdOrFail(id);
        await this.orderRepository.update(id, { status: dto.status } as any);
        const updated = await this.orderRepository.findWithItems(id);
        return updated!;
    }
}
