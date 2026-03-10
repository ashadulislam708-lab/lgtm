import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Payment } from './entities/payment.entity';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentService } from './services/payment.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { PaymentProcessor } from './processors/payment.processor';
import { PaymentController } from './controllers/payment.controller';
import { OrdersModule } from '@modules/orders/orders.module';
import { QueueModule } from '@infrastructure/queue/queue.module';
import { I18nHelper } from '@core/utils/i18n.helper';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';

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
