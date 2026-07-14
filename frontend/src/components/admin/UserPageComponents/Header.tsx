// src/components/admin/UserPageComponents/Header.tsx
// 1. Import type gốc từ file types của bạn để đồng bộ hệ thống
import type { AdminUserPagination } from '../../../types/admin.types'; 

interface HeaderProps {
    // 2. Thêm "undefined" vào đây để khớp với cú pháp bóc tách dữ liệu ở component cha
    userPagination: AdminUserPagination | undefined | null; 
}

export default function Header({ userPagination }: HeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Management</h1>
                {userPagination && (
                    <p className="text-xs font-medium text-slate-400 mt-1">
                        Overviews and management for <span className="text-blue-600 font-semibold">{userPagination.total}</span> registered users
                    </p>
                )}
            </div>
        </div>
    );
}