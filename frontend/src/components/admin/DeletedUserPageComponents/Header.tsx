import type { DeletedUser } from '../../../types/admin.types';

interface HeaderProps {
    users: DeletedUser[];
    loading: boolean;
}

export default function Header({ users, loading }: HeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Deleted Users</h1>
                {!loading && (
                    <p className="text-sm text-gray-400 mt-0.5">
                        {users.length} deleted users
                    </p>
                )}
            </div>
            {/* Badge nhắc nhở */}
            <span className="text-xs px-3 py-1.5 bg-orange-50 text-orange-600
          border border-orange-100 rounded-full font-medium">
                Data still exists in DB — only hidden from active list
            </span>
        </div>
    )
}