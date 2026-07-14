// src/pages/Admin/AdminUsersPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/admin.service';
import type { AdminUser, GetUsersResponse, UserStatusFilter, AdminUserPagination } from '../../types/admin.types';

import Header from '../../components/admin/UserPageComponents/Header';
import EditEmailModal from '../../components/admin/UserPageComponents/EditEmailModal';
import AccountHistoryModal from '../../components/admin/UserPageComponents/AccountHistoryModal';
import UserFilterBar from '../../components/admin/UserPageComponents/UserFilterBar';
import UserTableNull from '../../components/admin/UserPageComponents/UserTableNull';
import UserTable from '../../components/admin/UserPageComponents/UserTable';


function formatVND(amount: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(parseFloat(amount));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const LIMIT = 10;

interface ModalState {
  open: boolean;
  user: AdminUser | null;
  nextStatus: 'active' | 'locked';
}

export default function AdminUsersPage() {
  const [response, setResponse] = useState<GetUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter + search + pagination
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');
  const [pagination, setPagination] = useState<AdminUserPagination | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // Modal xác nhận khóa/mở tài khoản
  const [modal, setModal] = useState<ModalState>({
    open: false, user: null, nextStatus: 'locked',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const [editEmailUser, setEditEmailUser] = useState<AdminUser | null>(null);
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers({
        page,
        limit: LIMIT,
        status: statusFilter,
        search: search || undefined,
      });
      setResponse(data);
      setPagination(data.pagination);
    } catch {
      setError('Cannot load user list.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset về trang 1 khi đổi filter hoặc search
  const handleStatusFilter = (value: UserStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ── Khóa / Mở tài khoản ──────────────────────────────────
  const openModal = (user: AdminUser) => {
    setActionError('');
    setModal({
      open: true,
      user,
      nextStatus: user.status === 'active' ? 'locked' : 'active',
    });
  };

  const handleConfirmAction = async () => {
    if (!modal.user) return;
    setActionLoading(true);
    setActionError('');
    try {
      await adminService.updateUserStatus(modal.user.id, modal.nextStatus);
      setModal({ open: false, user: null, nextStatus: 'locked' });
      // Cập nhật local state thay vì refetch toàn bộ
      setResponse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((u) =>
            u.id === modal.user!.id ? { ...u, status: modal.nextStatus } : u,
          ),
        };
      });
    } catch {
      setActionError('Failed to update user status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Hàm soft delete
  const handleSoftDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await adminService.softDeleteUser(deleteModal.id);
      // Xóa khỏi local state
      setResponse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.filter((u) => u.id !== deleteModal.id),
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total - 1,
          },
        };
      });
      setDeleteModal(null);
    } catch {
      setActionError('Delete user failed. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEmailUpdated = (userId: string, newEmail: string) => {
    setResponse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: prev.data.map((u) =>
          u.id === userId ? { ...u, email: newEmail } : u,
        ),
      };
    });
  };

  const { data: users = [], pagination: userPagination } = response ?? {};

  return (
    <AppLayout>
      {/* Header section */}
      <Header userPagination={userPagination} />

      {/* Filter & Action bar */}
      <UserFilterBar
        handleStatusFilter={handleStatusFilter}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        handleSearchKeyDown={handleSearchKeyDown}
        statusFilter={statusFilter}
        search={search}
        setSearch={setSearch}
        setPage={setPage}
      />

      {/* Content Region */}
      {loading && (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      )}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchUsers} />}
      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <UserTableNull />
          ) : (
            //Phần bảng
            <UserTable 
              users={users} 
              loading={loading} 
              setEditEmailUser={setEditEmailUser}
              setDeleteModal={setDeleteModal}
              setHistoryUser={setHistoryUser}
              formatVND={formatVND}
              formatDate={formatDate}
              openModal={openModal}
            />
          )}

          {/* Pagination */}
          <div className="mt-5">
            <Pagination pagination={pagination} onPageChange={(targetPage) => setPage(targetPage)} />
          </div>
        </>
      )}

      {/* Confirm Modal */}
      {modal.open && modal.user && (
        <ConfirmModal
          title={modal.nextStatus === 'locked' ? 'Lock Account' : 'Unlock Account'}
          message={
            modal.nextStatus === 'locked'
              ? `Are you sure you want to lock the account of "${modal.user.full_name}"? The user will not be able to log in or make transactions.`
              : `Unlock the account of "${modal.user.full_name}"? The user will be able to log in and make transactions again.`
          }
          confirmLabel={modal.nextStatus === 'locked' ? 'Lock' : 'Unlock'}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setModal({ open: false, user: null, nextStatus: 'locked' })}
        />
      )}

      {/* Action error toast */}
      {actionError && (
        <div className="fixed bottom-6 right-6 bg-rose-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg animate-fade-in">
          {actionError}
        </div>
      )}

      {editEmailUser && (
        <EditEmailModal
          user={editEmailUser}
          onClose={() => setEditEmailUser(null)}
          onSuccess={handleEmailUpdated}
        />
      )}

      {historyUser && (
        <AccountHistoryModal
          user={historyUser}
          onClose={() => setHistoryUser(null)}
        />
      )}

      {deleteModal && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete the account of "${deleteModal.full_name}"? The data will still be in the database but will not appear in the active list.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={handleSoftDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </AppLayout>
  );
}