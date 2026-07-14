// src/pages/Admin/DeletedUsersPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Badge from '../../components/common/Badge';
import adminService from '../../services/admin.service';
import type { DeletedUser } from '../../types/admin.types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatVND(amount: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(parseFloat(amount));
}

export default function DeletedUsersPage() {
  const [users, setUsers]   = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getDeletedUsers();
      setUsers(data);
    } catch {
      setError('Cannot load deleted users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeleted(); }, [fetchDeleted]);

  return (
    <AppLayout>
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

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchDeleted} />}
      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p className="text-sm text-gray-400">No deleted accounts available</p>
            </div>
          ) : (
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
                        <Badge label="Đã xóa" variant="red" />
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Account */}
                    <div>
                      {user.account ? (
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
          )}
        </>
      )}
    </AppLayout>
  );
}