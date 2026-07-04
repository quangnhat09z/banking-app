// src/pages/Admin/AdminUsersPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/admin.service';
import type { AdminUser, GetUsersResponse, UserStatusFilter, AdminUserPagination } from '../../types/admin.types';


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

  const { data: users = [], pagination: userPagination } = response ?? {};

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          {userPagination && (
            <p className="text-sm text-gray-400 mt-0.5">
              Total {userPagination.total} users
            </p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${statusFilter === tab.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2 flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
              transition-colors text-sm font-medium"
          >
            Find
          </button>
          {search && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700
                border border-gray-200 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchUsers} />}
      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm text-gray-400">Cannot find any users</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              {/* Table header */}
              <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr] gap-4 px-5 py-3
                bg-gray-50 border-b border-gray-100 text-xs font-semibold
                text-gray-400 uppercase tracking-wide">
                <span>Users</span>
                <span>Bank Account</span>
                <span>Role</span>
                <span>Created Date</span>
                <span className="text-right">Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr] gap-4
                      items-center px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Name + email + status */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <span className={`shrink-0 inline-flex items-center gap-1
                          text-xs font-medium px-1.5 py-0.5 rounded-full
                          ${user.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-500'
                          }`}>
                          <span className={`w-1 h-1 rounded-full
                            ${user.status === 'active' ? 'bg-green-500' : 'bg-red-400'}`} />
                          {user.status === 'active' ? 'Active' : 'Locked'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Tài khoản ngân hàng */}
                    <div className="min-w-0">
                      {user.account ? (
                        <>
                          <p className="text-sm font-mono text-gray-700">
                            {user.account.account_number}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatVND(user.account.balance)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300 italic">No account available</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${user.role === 'admin'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-blue-50 text-blue-500'
                        }`}>
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                    </div>

                    {/* Ngày tạo */}
                    <div>
                      <p className="text-sm text-gray-500">{formatDate(user.created_at)}</p>
                    </div>

                    {/* Hành động */}
                    <div className="flex justify-end">
                      {/* Không cho khóa chính tài khoản admin */}
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => openModal(user)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg
                            border transition-colors
                            ${user.status === 'active'
                              ? 'border-red-200 text-red-500 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                        >
                          {user.status === 'active' ? 'Lock' : 'Unlock'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 italic">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          <Pagination pagination={pagination} onPageChange={(targetPage) => setPage(targetPage)} />

        </>
      )}

      {/* Confirm Modal */}
      {modal.open && modal.user && (
        <ConfirmModal
          title={modal.nextStatus === 'locked' ? 'Lock Account' : 'Unlock Account'}
          message={
            modal.nextStatus === 'locked'
              ? `Are you sure you want to lock the account of "${modal.user.full_name}"? 
                 The user will not be able to log in or make transactions.`
              : `Unlock the account of "${modal.user.full_name}"? 
                 The user will be able to log in and make transactions again.`
          }
          confirmLabel={modal.nextStatus === 'locked' ? 'Lock' : 'Unlock'}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setModal({ open: false, user: null, nextStatus: 'locked' })}
        />
      )}

      {/* Action error toast */}
      {actionError && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white text-sm
          px-4 py-3 rounded-xl shadow-lg">
          {actionError}
        </div>
      )}
    </AppLayout>
  );
}