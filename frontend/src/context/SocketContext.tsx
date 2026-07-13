// src/context/SocketContext.tsx
import {
    createContext, useContext, useEffect, useRef,
    useState, useCallback
} from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/auth.store';
import type { Notification } from '../types/notification.types';
import notificationService from '../services/notification.service';

interface SocketContextValue {
    notifications: Notification[];
    unreadCount: number;
    markOneRead: (notificationId: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextValue>({
    notifications: [],
    unreadCount: 0,
    markOneRead: async () => { },
    markAllRead: async () => { },
});

export function SocketProvider({ children }: { children: ReactNode }) {
    const { token, isAuthenticated } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadInitNotifications = useCallback(async () => {
        try {
            const [notifs, count] = await Promise.all([
                notificationService.getAll(),
                notificationService.getUnreadCount(),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
            // console.log('[Socket] Initial notifications loaded:', notifs.length, 'Unread count:', count);
        } catch {
            //
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !token) return;

        // load thông báo cũ
        loadInitNotifications();

        // kết nối socket với JWT trong auth
        const socket = io(`${import.meta.env.VITE_API_URL}/notifications`, {
            auth: { token },
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
        });

        // nhận thông báo mới
        socket.on('new_notification', (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            const isReceived = notification.type === 'transfer_received';
            toast(
                <div>
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notification.body}</p>
                </div>,
                {
                    type: isReceived ? 'success' : 'info',
                    position: 'bottom-right',
                    autoClose: 5000,
                },
            );
        });

        // ngắt
        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        // lỗi kết nối
        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };

    }, [isAuthenticated, token, loadInitNotifications]);

    const markAllRead = useCallback(async () => {
        await notificationService.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, []);

    const markOneRead = useCallback(async (id: string) => {
        await notificationService.markOneRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    return (
        <SocketContext.Provider value={{ notifications, unreadCount, markOneRead, markAllRead }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
