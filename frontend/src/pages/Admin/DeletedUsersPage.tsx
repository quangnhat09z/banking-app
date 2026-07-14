// src/pages/Admin/DeletedUsersPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import adminService from '../../services/admin.service';
import type { DeletedUser } from '../../types/admin.types';
import Header from '../../components/admin/DeletedUserPageComponents/Header';
import DeletedTableNull from '../../components/admin/DeletedUserPageComponents/DeletedTableNull';
import DeletedUserTable from '../../components/admin/DeletedUserPageComponents/DeletedUserTable';

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
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getDeletedUsers();
      console.log('Deleted users:', data);
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
      {/* Header section */}
      <Header
        users={users}
        loading={loading}
      />

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchDeleted} />}
      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <DeletedTableNull />
          ) : (
            <DeletedUserTable
              users={users}
              formatDate={formatDate}
              formatVND={formatVND}
            />
          )}
        </>
      )}
    </AppLayout>
  );
}