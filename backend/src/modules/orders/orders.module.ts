import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { ProductsModule } from '@modules/products/products.module';
import { I18nHelper } from '@core/utils/i18n.helper';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { QueueModule } from '@infrastructure/queue/queue.module';

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
    providers: [OrderRepository, OrderItemRepository, OrderService, I18nHelper],
    exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
