// src/components/AppLayout.tsx
import { Sidebar } from './sidebar/Sidebar';
import { NotificationBell } from './common/NotificationBell/NotificationBell.index';

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 bg-slate-50/50">
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-md">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-slate-700">Welcome back</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <NotificationBell />
            </div>
          </div>
        </header>

        <div className="overflow-y-auto max-w-5xl mx-auto px-6 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

    </div>
  );
}