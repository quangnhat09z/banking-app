// src/components/sidebar/SidebarComponents/NotificationBell.tsx
import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { NotificationHeader } from './PopupHeader';
import { NotifListNull } from './NotifListNull';
import { NotifList } from './NotifList';
import { BellButton } from './BellButton';

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
      <BellButton
        open={open}
        unreadCount={unreadCount}
        handleOpen={handleOpen}
      />

      {open && (
        <div className="absolute right-0 top-full mb-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100/80 overflow-hidden z-50 flex flex-col animate-fade-in">
          {/* Notification dropdown header */}
          <NotificationHeader
            notifications={notifications}
            unreadCount={unreadCount}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleMarkAllRead={handleMarkAllRead}
          />

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100/50">
            {filteredNotifications.length === 0 ? (
              <NotifListNull />
            ) : (
              filteredNotifications.map((notification) => {
                const isReceived = notification.type === 'transfer_received';

                return (
                  <NotifList  
                    key={notification.id}
                    notification={notification}
                    handleClickItem={handleClickItem}
                    timeAgo={timeAgo}
                    isReceived={isReceived}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
