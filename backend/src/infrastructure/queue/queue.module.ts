import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { envConfigService } from 'src/config/env-config.service';
import { QUEUE_NAMES } from './queue.constants';

@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: envConfigService.getRedisConfig().host,
                port: envConfigService.getRedisConfig().port,
            },
        }),
        BullModule.registerQueue(
            { name: QUEUE_NAMES.PAYMENT_PROCESSING },
            { name: QUEUE_NAMES.NOTIFICATION },
            { name: QUEUE_NAMES.REPORT_GENERATION },
            { name: QUEUE_NAMES.INVENTORY_SYNC },
        ),
    ],
    exports: [BullModule],
})
export class QueueModule {}
