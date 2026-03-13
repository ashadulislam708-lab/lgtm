import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { NotificationService } from '../services/notification.service';
import { NotificationTypeEnum } from '@shared/enums/notification-type.enum';

interface NotificationJobData {
    userId: string;
    type: NotificationTypeEnum;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    correlationId?: string;
}

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(private readonly notificationService: NotificationService) {
        super();
    }

    async process(job: Job<NotificationJobData>): Promise<void> {
        const { userId, type, title, message, metadata, correlationId } =
            job.data;

        this.logger.log(
            `Processing notification job ${job.id} [correlationId: ${correlationId || 'N/A'}] - type: ${type}, userId: ${userId}`,
        );

        await this.notificationService.createNotification(
            userId,
            type,
            title,
            message,
            metadata,
        );

        this.logger.log(
            `Notification job ${job.id} completed [correlationId: ${correlationId || 'N/A'}]`,
        );
    }
}
