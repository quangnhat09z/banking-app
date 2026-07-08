// src/components/AppLayout.tsx
import { Sidebar } from './sidebar/Sidebar';
import { NotificationBell } from './sidebar/SidebarComponents/NotificationBell';

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />


      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>

      {/* Notification Bell */}
      <div className="px-4 py-3 border-t border-slate-200/50 bg-slate-50/60">
        <div className="flex items-center justify-between rounded-xl px-2 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-700">Notifications</p>
            <p className="text-xs text-slate-400 mt-0.5">Latest account updates</p>
          </div>
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}