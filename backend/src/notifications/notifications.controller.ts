// src/notifications/notifications.controller.ts
import {
    Controller, Get, Patch, Param,
    UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    // lấy thông báo khi user login vào
    @Get()
    getMyNotifications(@CurrentUser() user: JwtPayload) {
        return this.notificationsService.findByUserId(user.userId);
    }

    @Get('unread-count')
    getUnreadCount(@CurrentUser() user: JwtPayload) {
        return this.notificationsService.countUnread(user.userId);
    }

    @Patch(':id/read')
    markOneRead(
        @Param('id', new ParseUUIDPipe()) notificationId: string,
        @CurrentUser() user: JwtPayload
    ) {
        return this.notificationsService.markOneRead(notificationId, user.userId);
    }

    @Patch('mark-all-read')
    markAllRead(@CurrentUser() user: JwtPayload) {
        return this.notificationsService.markAllRead(user.userId);
    }
}
