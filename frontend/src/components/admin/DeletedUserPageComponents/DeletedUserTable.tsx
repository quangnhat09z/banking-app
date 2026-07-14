// src/components/admin/DeletedUserPageComponents/DeletedUserTable.tsx
import type { DeletedUser } from '../../../types/admin.types';
import Badge from '../../common/Badge';

interface DeletedUserProps {
    users: DeletedUser[];
    formatDate: (dateStr: string) => string;   
    formatVND: (amount: string) => string;
}

export default function DeletedUserTable({ users, formatDate, formatVND }: DeletedUserProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1.5fr] gap-4
                px-5 py-3 bg-gray-50 border-b border-gray-100
                text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span>User</span>
                <span>Bank Account</span>
                <span>Created Date</span>
                <span>Role</span>
                <span>Deleted Date</span>
            </div>

            <div className="divide-y divide-gray-50">
                {users.map((user) => (
                    <div key={user.id}
                        className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1.5fr] gap-4
                      items-center px-5 py-4 opacity-70 hover:opacity-100 transition-opacity">

                        {/* User info */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.full_name}
                                </p>
                                <Badge label="Deleted" variant="red" />
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                        </div>

                        {/* Account */}
                        <div>
                            {user.account  ? (
                                <>
                                    <p className="text-sm font-mono text-gray-600">
                                        {user.account.account_number}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatVND(user.account.balance)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-gray-300 italic">—</p>
                            )}
                        </div>

                        {/* Ngày tạo */}
                        <p className="text-sm text-gray-500">{formatDate(user.created_at)}</p>

                        {/* Role */}
                        <Badge
                            label={user.role === 'admin' ? 'Admin' : 'Customer'}
                            variant={user.role === 'admin' ? 'purple' : 'blue'}
                        />

                        {/* Ngày xóa */}
                        <p className="text-sm text-red-400 font-medium">
                            {formatDate(user.deleted_at)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}