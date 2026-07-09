// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) { }

    async create(dto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepo.create(dto);
        return await this.notificationRepo.save(notification);
    }

    async findByUserId(userId: string): Promise<Notification[]> {
        return await this.notificationRepo.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: 20, // limit 20
        });
    }

    // đánh dấu đã đọc 1 notification
    async markOneRead(notificationId: string, userId: string): Promise<void> {
        await this.notificationRepo.update(
            { id: notificationId, user_id: userId },
            { is_read: true }
        );
    }

    async markAllRead(userId: string): Promise<void> {
        await this.notificationRepo.update(
            { user_id: userId, is_read: false },
            { is_read: true }
        );
    }

    // Đếm số chưa đọc
    async countUnread(userId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { user_id: userId, is_read: false },
        });
    }

}
