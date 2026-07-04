// src/components/Sidebar.tsx

import { useAuthStore } from '../../store/auth.store';
import authService from '../../services/auth.service';
import { NavigationLink } from './SidebarComponents/NavigationLink';
import { Footer } from './SidebarComponents/Footer';
import { useNavigate } from 'react-router-dom';
import { Header } from './SidebarComponents/Header';
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

            {/* User Profile Footer */}
            <Footer user={user} handleLogout={handleLogout} />

        </aside>
    );
}