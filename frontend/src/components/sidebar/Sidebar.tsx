// src/components/Sidebar.tsx

import { useAuthStore } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import { NavigationLink } from './SidebarComponents/NavigationLink';
import { Footer } from './SidebarComponents/Footer';
import { Header } from './SidebarComponents/Header';
import { NotificationBell } from './SidebarComponents/NotificationBell';
import { adminNavItems, baseNavItems } from './NavItems/NavItems';

export function Sidebar() {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();

    const handleLogout = () => {
        authService.logout();
        clearAuth();
        navigate('/login', { replace: true });
    };

    const currentNavItems = user?.role === 'admin'
        ? [...baseNavItems, ...adminNavItems]
        : baseNavItems;

    return (
        <aside className="w-64 bg-slate-50/80 text-slate-600 flex flex-col h-screen sticky top-0 border-r border-slate-200/60 backdrop-blur-md">
            {/* Brand Logo / Header */}
            <Header />

            {/* Navigation Links */}
            <NavigationLink currentNavItems={currentNavItems} />

            {/* Notification Bell
            <div className="px-4 py-3 border-t border-slate-200/50 bg-slate-50/60">
                <div className="flex items-center justify-between rounded-xl px-2 py-2">
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Notifications</p>
                        <p className="text-xs text-slate-400 mt-0.5">Latest account updates</p>
                    </div>
                    <NotificationBell />
                </div>
            </div> */}

            {/* User Profile Footer */}
            <Footer user={user} handleLogout={handleLogout} />
        </aside>
    );
}
