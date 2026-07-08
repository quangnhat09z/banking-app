// src/types/notification.types.ts
export type NotificationType = 'transfer_sent' | 'transfer_received';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}