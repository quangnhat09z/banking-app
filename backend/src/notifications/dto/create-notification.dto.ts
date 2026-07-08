// src/notifications/dto/create-notification.dto.ts
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  user_id!: string;
  type!: NotificationType;
  title!: string;
  body!: string;
}