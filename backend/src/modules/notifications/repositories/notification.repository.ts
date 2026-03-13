import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/core/base';
import { Notification } from '../entities/notification.entity';
import { NotificationFilterDto } from '../dto';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) {
        super(notificationRepository);
    }

    /**
     * Find notifications by userId with pagination and optional isRead filter
     */
    async findByUserId(
        userId: string,
        filterDto: NotificationFilterDto,
    ): Promise<{ data: Notification[]; total: number }> {
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;
        const skip = (page - 1) * limit;
        const sortBy = filterDto.sortBy || 'createdAt';
        const sortOrder = filterDto.sortOrder || 'DESC';

        const qb = this.notificationRepository
            .createQueryBuilder('notification')
            .where('notification.userId = :userId', { userId });

        if (filterDto.isRead !== undefined) {
            qb.andWhere('notification.isRead = :isRead', {
                isRead: filterDto.isRead,
            });
        }

        qb.orderBy(`notification.${sortBy}`, sortOrder).skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    /**
     * Find all notifications with pagination (admin use)
     */
    async findAllPaginated(
        filterDto: NotificationFilterDto,
    ): Promise<{ data: Notification[]; total: number }> {
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;
        const skip = (page - 1) * limit;
        const sortBy = filterDto.sortBy || 'createdAt';
        const sortOrder = filterDto.sortOrder || 'DESC';

        const qb =
            this.notificationRepository.createQueryBuilder('notification');

        if (filterDto.isRead !== undefined) {
            qb.andWhere('notification.isRead = :isRead', {
                isRead: filterDto.isRead,
            });
        }

        qb.orderBy(`notification.${sortBy}`, sortOrder).skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    /**
     * Count unread notifications for a user
     */
    async countUnread(userId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string): Promise<void> {
        await this.notificationRepository.update(id, { isRead: true });
    }
}
