// src/services/notification.service.ts
import axiosInstance from '../api/axios';
import type { Notification } from '../types/notification.types';

const notificationService = {
    getAll: async (): Promise<Notification[]> => {
        const response = await axiosInstance.get('/notifications');
        return response.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await axiosInstance.get('/notifications/unread-count');
        return response.data;
    },

    markOneRead: async (notificationId: string): Promise<void> => {
        await axiosInstance.patch(`/notifications/${notificationId}/read`);
    },

    markAllRead: async (): Promise<void> => {
        await axiosInstance.patch('/notifications/mark-all-read');
    }
}

export default notificationService;