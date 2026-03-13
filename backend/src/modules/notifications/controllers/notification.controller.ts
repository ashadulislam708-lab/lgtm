import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from 'src/core/decorators/api-swagger.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { NotificationService } from '../services/notification.service';
import { NotificationFilterDto } from '../dto';
import { PaginatedResponseDto, SuccessResponseDto } from '@shared/dtos';
import { Notification } from '../entities/notification.entity';
import { RolesEnum } from '@shared/enums/role.enum';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Get notifications
     * User gets own notifications, Admin gets all
     * GET /notifications
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notifications',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
        errors: [
            { status: 401, description: 'Unauthorized' },
        ],
    })
    async getNotifications(
        @CurrentUser() user: any,
        @Query() filterDto: NotificationFilterDto,
    ): Promise<PaginatedResponseDto<Notification>> {
        return this.notificationService.getNotifications(
            user?.id || '',
            user?.role ?? RolesEnum.ADMIN,
            filterDto,
        );
    }

    /**
     * Mark notification as read
     * PATCH /notifications/:id/read
     */
    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notification',
        operation: 'update',
        summary: 'Mark notification as read',
        errors: [
            { status: 401, description: 'Unauthorized' },
            { status: 403, description: 'Forbidden - not your notification' },
            { status: 404, description: 'Notification not found' },
        ],
    })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ): Promise<SuccessResponseDto<Notification>> {
        return this.notificationService.markAsRead(id, user?.id || '');
    }
}
