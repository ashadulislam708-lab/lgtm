import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Payment } from './entities/payment.entity.js';
import { PaymentRepository } from './repositories/payment.repository.js';
import { PaymentService } from './services/payment.service.js';
import { PaymentGatewayService } from './services/payment-gateway.service.js';
import { PaymentProcessor } from './processors/payment.processor.js';
import { PaymentController } from './controllers/payment.controller.js';
import { OrdersModule } from '@modules/orders/orders.module.js';
import { QueueModule } from '@infrastructure/queue/queue.module.js';
import { I18nHelper } from '@core/utils/i18n.helper.js';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        forwardRef(() => OrdersModule),
        QueueModule,
        BullModule.registerQueue(
            {
                name: QUEUE_NAMES.PAYMENT_PROCESSING,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: 100,
                    removeOnFail: 50,
                },
            },
            { name: QUEUE_NAMES.NOTIFICATION },
        ),
    ],
    controllers: [PaymentController],
    providers: [
        PaymentRepository,
        PaymentService,
        PaymentGatewayService,
        PaymentProcessor,
        I18nHelper,
    ],
    exports: [PaymentService, PaymentRepository],
})
export class PaymentsModule {}
