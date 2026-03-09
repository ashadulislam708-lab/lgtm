import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { NotificationTypeEnum } from '@shared/enums/notification-type.enum';
import { User } from '@modules/users/user.entity';

@Entity('notifications')
@Index(['userId'])
@Index(['type'])
@Index(['isRead'])
export class Notification extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({
        type: 'enum',
        enum: NotificationTypeEnum,
    })
    type: NotificationTypeEnum;

    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any> | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
