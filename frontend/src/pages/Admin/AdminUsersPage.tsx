// src/pages/Admin/AdminUsersPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/admin.service';
import type { AdminUser, GetUsersResponse, UserStatusFilter, AdminUserPagination } from '../../types/admin.types';

import EditEmailModal from '../../components/admin/EditEmailModal';
import AccountHistoryModal from '../../components/admin/AccountHistoryModal';

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

const STATUS_TABS: { label: string; value: UserStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Locked', value: 'locked' },
];

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

      {/* Filter & Action bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-200/60">
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer
                ${statusFilter === tab.value
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input Group */}
        <div className="flex items-center gap-2 w-full lg:max-w-md">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by user name, email address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 outline-hidden transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-xs font-bold shadow-xs shadow-blue-500/10 cursor-pointer"
          >
            Find
          </button>
          {search && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

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
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs">
              <div className="p-3 bg-slate-50 rounded-2xl mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-slate-400">No matching users found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[950px]">
                  
                  {/* Table header - CỐ ĐỊNH TỶ LỆ % ĐỂ KHÔNG BỊ LỆCH HÀNG */}
                  <div className="grid grid-cols-[20%_14%_14%_14%_31%] gap-4 px-6 py-3.5
                    bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold
                    text-slate-400 uppercase tracking-wider">
                    <span className="text-left">Users Info</span>
                    <span className="text-center">Bank Account</span>
                    <span className="text-center">Role</span>
                    <span className="text-center">Created Date</span>
                    <span className="text-center pr-4">Actions</span>
                  </div>

                  {/* Rows Container */}
                  <div className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="grid grid-cols-[20%_14%_14%_14%_31%] gap-4
                          items-center px-6 py-3.5 hover:bg-slate-50/40 transition-colors"
                      >
                        {/* 1. Name + email + status (Căn trái) */}
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {user.full_name}
                            </p>
                            <span className={`shrink-0 inline-flex items-center gap-1
                              text-[10px] font-bold px-2 py-0.5 rounded-full
                              ${user.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/40'
                                : 'bg-rose-50 text-rose-600 border border-rose-200/40'
                              }`}>
                              <span className={`w-1 h-1 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {user.status === 'active' ? 'Active' : 'Locked'}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>

                        {/* 2. Tài khoản ngân hàng (Căn trái để thẳng hàng với tiêu đề) */}
                        <div className="min-w-0 text-center">
                          {user.account ? (
                            <div className="space-y-0.5">
                              <p className="text-xs font-mono font-bold text-slate-700 tracking-tight">
                                {user.account.account_number}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-500">
                                {formatVND(user.account.balance)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-300 italic font-medium">No account connected</p>
                          )}
                        </div>

                        {/* 3. Role (Căn giữa - Badge sẽ nằm ngay tâm chữ ROLE ở trên) */}
                        <div className="flex justify-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase block w-fit
                            ${user.role === 'admin'
                              ? 'bg-purple-50 text-purple-600 border border-purple-200/40'
                              : 'bg-blue-50 text-blue-600 border border-blue-200/40'
                            }`}>
                            {user.role === 'admin' ? 'Admin' : 'Customer'}
                          </span>
                        </div>

                        {/* 4. Ngày tạo (Căn giữa - Thẳng hàng hoàn hảo) */}
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-500">{formatDate(user.created_at)}</p>
                        </div>

                        {/* 5. Hành động (Căn phải hoàn toàn kịch biên) */}
                        <div className="flex items-center justify-around gap-1.5 h-full">
                          {user.role !== 'admin' ? (
                            <>
                              <button
                                onClick={() => openModal(user)}
                                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs
                                  ${user.status === 'active'
                                    ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                                    : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                                  }`}
                              >
                                {user.status === 'active' ? 'Lock' : 'Unlock'}
                              </button>

                              <button
                                onClick={() => setEditEmailUser(user)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer shadow-2xs"
                              >
                                Email
                              </button>

                              <button
                                onClick={() => setHistoryUser(user)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                              >
                                History
                              </button>

                              <button
                                onClick={() => setDeleteModal(user)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold tracking-wide select-none border border-slate-200/40">
                              🛡️ System Protected
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
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