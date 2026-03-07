import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { BaseService } from 'src/core/base';
import { I18nHelper } from '@core/utils/i18n.helper';
import { Notification } from '../entities/notification.entity';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationFilterDto } from '../dto';
import { NotificationTypeEnum } from '@shared/enums/notification-type.enum';
import { RolesEnum } from '@shared/enums';
import { PaginatedResponseDto, SuccessResponseDto } from '@shared/dtos';

@Injectable()
export class NotificationService extends BaseService<Notification> {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly i18nHelper: I18nHelper,
    ) {
        super(notificationRepository, 'Notification');
    }

    /**
     * Create a new notification
     */
    async createNotification(
        userId: string,
        type: NotificationTypeEnum,
        title: string,
        message: string,
        metadata?: Record<string, any>,
    ): Promise<Notification> {
        return this.notificationRepository.create({
            userId,
            type,
            title,
            message,
            metadata: metadata || null,
        });
    }

    /**
     * Get notifications - admin gets all, user gets own
     */
    async getNotifications(
        userId: string,
        role: RolesEnum,
        filterDto: NotificationFilterDto,
    ): Promise<PaginatedResponseDto<Notification>> {
        const isAdmin = role === RolesEnum.ADMIN;
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;

        const { data, total } = isAdmin
            ? await this.notificationRepository.findAllPaginated(filterDto)
            : await this.notificationRepository.findByUserId(userId, filterDto);

        return new PaginatedResponseDto(
            data,
            page,
            limit,
            total,
            this.i18nHelper.t('translation.notifications.success.retrieved'),
        );
    }

    /**
     * Mark a notification as read (verifies ownership)
     */
    async markAsRead(
        id: string,
        userId: string,
    ): Promise<SuccessResponseDto<Notification>> {
        const notification = await this.notificationRepository.findById(id);

        if (!notification) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.notifications.error.not_found'),
            );
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException();
        }

        await this.notificationRepository.markAsRead(id);

        const updated = await this.notificationRepository.findById(id);
        return new SuccessResponseDto(
            updated!,
            this.i18nHelper.t('translation.notifications.success.marked_read'),
        );
    }

    /**
     * Get count of unread notifications for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepository.countUnread(userId);
    }
}
