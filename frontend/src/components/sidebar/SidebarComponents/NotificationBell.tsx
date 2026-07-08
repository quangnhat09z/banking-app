// src/components/sidebar/SidebarComponents/NotificationBell.tsx
import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../../context/SocketContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  return `${Math.floor(hours / 24)} days ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markOneRead } = useSocket();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => setOpen((prev) => !prev);

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleClickItem = async (id: string, isRead: boolean) => {
    if (!isRead) await markOneRead(id);
  };

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((notification) => !notification.is_read);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open notifications"
        className={`relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
          open
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-transform ${
            unreadCount > 0 && !open
              ? 'animate-[wiggle_1s_ease-in-out_infinite]'
              : 'group-hover:scale-105'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mb-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100/80 overflow-hidden z-50 flex flex-col animate-fade-in">
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
                className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'hover:text-gray-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'hover:text-gray-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100/50">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 font-medium">Không có thông báo nào ở mục này</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const isReceived = notification.type === 'transfer_received';

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleClickItem(notification.id, notification.is_read)}
                    className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-2 ${
                      !notification.is_read
                        ? 'bg-blue-50/20 border-blue-500 hover:bg-blue-50/40'
                        : 'border-transparent hover:bg-gray-50/60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                        isReceived
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
                          className={`text-xs leading-snug tracking-tight ${
                            !notification.is_read
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
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
