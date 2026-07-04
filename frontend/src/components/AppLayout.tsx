// src/components/AppLayout.tsx
import { Sidebar } from './sidebar/Sidebar';

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
    </div>
  );
}