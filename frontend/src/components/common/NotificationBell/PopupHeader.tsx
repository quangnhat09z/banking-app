// src/components/common/NotificationBell/NotificationHeader.tsx
import type { Notification } from '../../../types/notification.types';

interface HeaderProps {
    notifications: Notification[];
    unreadCount: number;
    activeTab: 'all' | 'unread';
    setActiveTab: (tab: 'all' | 'unread') => void;
    handleMarkAllRead: () => Promise<void>;
}
export function NotificationHeader({ notifications, unreadCount, activeTab, setActiveTab, handleMarkAllRead }: HeaderProps) {
    return (
        <div className="p-4 border-b border-gray-100/60 pb-3">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                    >
                        Mark all as read ({unreadCount})
                    </button>
                )}
            </div>

            <div className="flex gap-1 bg-gray-100/70 p-0.5 rounded-lg text-xs font-medium text-gray-500">
                <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-1 rounded-md transition cursor-pointer ${activeTab === 'all'
                            ? 'bg-white text-gray-900 font-bold shadow-xs'
                            : 'hover:text-gray-800'
                        }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 py-1 rounded-md transition cursor-pointer ${activeTab === 'unread'
                            ? 'bg-white text-gray-900 font-bold shadow-xs'
                            : 'hover:text-gray-800'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>
        </div>
    )
}