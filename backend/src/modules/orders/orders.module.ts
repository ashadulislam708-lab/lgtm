import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderRepository } from './repositories/order.repository.js';
import { OrderItemRepository } from './repositories/order-item.repository.js';
import { OrderService } from './services/order.service.js';
import { OrderController } from './controllers/order.controller.js';
import { ProductsModule } from '@modules/products/products.module.js';
import { I18nHelper } from '@core/utils/i18n.helper.js';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants.js';
import { QueueModule } from '@infrastructure/queue/queue.module.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem]),
        ProductsModule,
        QueueModule,
        BullModule.registerQueue(
            { name: QUEUE_NAMES.PAYMENT_PROCESSING },
            { name: QUEUE_NAMES.NOTIFICATION },
        ),
    ],
    controllers: [OrderController],
    providers: [
        OrderRepository,
        OrderItemRepository,
        OrderService,
        I18nHelper,
    ],
    exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
