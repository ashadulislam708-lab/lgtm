import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from '@infrastructure/queue/queue.module';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationController } from './controllers/notification.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Notification]), QueueModule],
    controllers: [NotificationController],
    providers: [
        NotificationRepository,
        NotificationService,
        NotificationProcessor,
        I18nHelper,
    ],
    exports: [NotificationService],
})
export class NotificationsModule {}
