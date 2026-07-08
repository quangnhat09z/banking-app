import type { Notification } from '../../../types/notification.types';

interface NotifListProps {
    notification: Notification;
    handleClickItem: (id: string, isRead: boolean) => void;
    timeAgo: (dateStr: string) => string;
    isReceived: boolean;
}
export function NotifList({ notification, handleClickItem, timeAgo, isReceived }: NotifListProps) {
    return (
        <div
            key={notification.id}
            onClick={() => handleClickItem(notification.id, notification.is_read)}
            className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-2 ${!notification.is_read
                    ? 'bg-blue-50/20 border-blue-500 hover:bg-blue-50/40'
                    : 'border-transparent hover:bg-gray-50/60'
                }`}
        >
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isReceived
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/40'
                        : 'bg-gray-100 text-gray-600 border border-gray-200/40'
                    }`}
            >
                {isReceived ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4
                        className={`text-xs leading-snug tracking-tight ${!notification.is_read
                                ? 'font-bold text-gray-900'
                                : 'font-semibold text-gray-700'
                            }`}
                    >
                        {notification.title}
                    </h4>
                    {!notification.is_read && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5 shadow-xs" />
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                    {notification.body}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                    <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-[10px] font-medium text-gray-400">
                        {timeAgo(notification.created_at)}
                    </span>
                </div>
            </div>
        </div>
    )
}