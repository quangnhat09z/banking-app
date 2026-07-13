// src/pages/Admin/AuditLogPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import auditService from '../../services/audit.service';
import type { AuditLog, AuditAction, AuditEntity, AuditLogFilters } from '../../types/audit.types';

// ── Config hiển thị cho từng action ─────────────────────────────
const ACTION_CONFIG: Record<AuditAction, { label: string; color: string }> = {
  LOGIN:             { label: 'Login',     color: 'bg-blue-50 text-blue-600' },
  LOGOUT:            { label: 'Logout',     color: 'bg-gray-100 text-gray-500' },
  REGISTER:          { label: 'Register',       color: 'bg-purple-50 text-purple-600' },
  ACCOUNT_LOCKED:    { label: 'Lock Account',       color: 'bg-red-50 text-red-500' },
  ACCOUNT_UNLOCKED:  { label: 'Unlock Account',   color: 'bg-green-50 text-green-600' },
  ACCOUNT_DELETED:   { label: 'Delete Account',        color: 'bg-red-100 text-red-700' },
  TRANSFER_CREATED:  { label: 'Transfer Created',  color: 'bg-cyan-50 text-cyan-600' },
  TRANSFER_REVERSED: { label: 'Transfer Reversed',     color: 'bg-orange-50 text-orange-600' },
  USER_UPDATED:      { label: 'User Updated',      color: 'bg-yellow-50 text-yellow-600' },
  PASSWORD_CHANGED:  { label: 'Password Changed', color: 'bg-pink-50 text-pink-600' },
};

const ENTITY_LABEL: Record<AuditEntity, string> = {
  users:        'User',
  accounts:     'Account',
  transactions: 'Transaction',
};

const ACTION_TABS: { label: string; value: AuditAction | 'all' }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Login',    value: 'LOGIN' },
  { label: 'Register',      value: 'REGISTER' },
  { label: 'Lock/Unlock Account',  value: 'ACCOUNT_LOCKED' },
  { label: 'Transfer', value: 'TRANSFER_CREATED' },
  { label: 'Reverse Transfer',    value: 'TRANSFER_REVERSED' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function truncate(str: string | null, max = 12): string {
  if (!str) return '—';
  return str.length > max ? `${str.slice(0, max)}...` : str;
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function valueOf(log: AuditLog, key: string) {
  return log.after_data?.[key] ?? log.before_data?.[key] ?? null;
}

function formatStatus(status: unknown) {
  if (typeof status !== 'string' || !status.trim()) {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
        -
      </span>
    );
  }

  const normalizedStatus = status.toLowerCase();
  const label = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  const statusClassMap: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    unlocked: 'bg-green-50 text-green-600',
    completed: 'bg-green-50 text-green-600',
    success: 'bg-green-50 text-green-600',
    successful: 'bg-green-50 text-green-600',

    pending: 'bg-yellow-50 text-yellow-700',
    processing: 'bg-yellow-50 text-yellow-700',

    locked: 'bg-red-50 text-red-600',
    deleted: 'bg-red-50 text-red-600',
    failed: 'bg-red-50 text-red-600',

    reversed: 'bg-orange-50 text-orange-600',
    cancelled: 'bg-orange-50 text-orange-600',
  };

  const colorClass = statusClassMap[normalizedStatus] ?? 'bg-gray-100 text-gray-500';

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

function getActorInfo(log: AuditLog) {
  const name = valueOf(log, 'full_name');
  const email = valueOf(log, 'email');
  const role = valueOf(log, 'role');
  const account = valueOf(log, 'from_account_number');

  if (name || email) {
    return {
      primary: String(name || email),
      secondary: [email && name ? email : null, role ? `Role: ${role}` : null]
        .filter(Boolean)
        .join(' - '),
    };
  }

  if (account) {
    return {
      primary: `Account ${account}`,
      secondary: log.actor_id ? `User ${truncate(log.actor_id)}` : '',
    };
  }

  return {
    primary: log.actor_id ? `User ${truncate(log.actor_id)}` : 'System / Unknown',
    secondary: '',
  };
}

function getTargetInfo(log: AuditLog) {
  switch (log.action) {
    case 'LOGIN':
      return {
        primary: valueOf(log, 'email') ? String(valueOf(log, 'email')) : 'User login',
        secondary: 'Authentication event',
      };

    case 'REGISTER':
      return {
        primary: valueOf(log, 'full_name') ? String(valueOf(log, 'full_name')) : 'New customer',
        secondary: valueOf(log, 'account_number')
          ? `Account ${valueOf(log, 'account_number')}`
          : String(valueOf(log, 'email') ?? ''),
      };

    case 'TRANSFER_CREATED':
      return {
        primary: valueOf(log, 'to_account_number')
          ? `To account ${valueOf(log, 'to_account_number')}`
          : 'Receiver account',
        secondary: valueOf(log, 'to_user_id')
          ? `Receiver user ${truncate(String(valueOf(log, 'to_user_id')))}`
          : '',
      };

    case 'TRANSFER_REVERSED':
      return {
        primary: 'Reversed transaction',
        secondary: valueOf(log, 'original_transaction_id')
          ? `Original ${truncate(String(valueOf(log, 'original_transaction_id')))}`
          : '',
      };

    case 'ACCOUNT_LOCKED':
    case 'ACCOUNT_UNLOCKED':
    case 'ACCOUNT_DELETED':
      return {
        primary: valueOf(log, 'target_user_id')
          ? `Target user ${truncate(String(valueOf(log, 'target_user_id')))}`
          : 'Target account',
        secondary: log.entity_id ? `Record ${truncate(log.entity_id)}` : '',
      };

    default:
      return {
        primary: log.entity ? ENTITY_LABEL[log.entity] : 'Record',
        secondary: log.entity_id ? truncate(log.entity_id) : '',
      };
  }
}

function getDetailInfo(log: AuditLog) {
  switch (log.action) {
    case 'LOGIN':
      return {
        primary: 'Signed in successfully',
        secondary: log.ip_address ? `IP ${log.ip_address}` : '',
      };

    case 'REGISTER':
      return {
        primary: 'Created a new customer profile',
        secondary: valueOf(log, 'account_number')
          ? `Account number ${valueOf(log, 'account_number')}`
          : '',
      };

    case 'TRANSFER_CREATED':
      return {
        primary: `${formatMoney(valueOf(log, 'amount'))} transferred`,
        secondary: [
          valueOf(log, 'from_account_number') ? `From ${valueOf(log, 'from_account_number')}` : null,
          valueOf(log, 'description') ? `Note: ${valueOf(log, 'description')}` : null,
        ].filter(Boolean).join(' - '),
      };

    case 'TRANSFER_REVERSED':
      return {
        primary: 'Transfer reversal completed',
        secondary: valueOf(log, 'reversal_id')
          ? `Reversal ${truncate(String(valueOf(log, 'reversal_id')))}`
          : '',
      };

    case 'ACCOUNT_LOCKED':
    case 'ACCOUNT_UNLOCKED':
    case 'ACCOUNT_DELETED':
      return {
        primary: log.action === 'ACCOUNT_LOCKED'
          ? 'Account was locked'
          : log.action === 'ACCOUNT_UNLOCKED'
            ? 'Account was unlocked'
            : 'Account was deleted',
        secondary: valueOf(log, 'status') ? `New status: ${valueOf(log, 'status')}` : '',
      };

    default:
      return {
        primary: 'Audit event recorded',
        secondary: '',
      };
  }
}

const LIMIT = 10;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1, limit: LIMIT, action: 'all', entity: 'all',
  });

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditService.getAll(filters);
    //   console.log('Fetched audit logs:', res);
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);    
    } catch {
      setError('Can not fetch audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const setPage = (page: number) =>
    setFilters((f) => ({ ...f, page }));

  const setAction = (action: AuditAction | 'all') =>
    setFilters((f) => ({ ...f, action, page: 1 }));

  const setEntity = (entity: AuditEntity | 'all') =>
    setFilters((f) => ({ ...f, entity, page: 1 }));

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          {!loading && (
            <p className="text-sm text-gray-400 mt-0.5">
              Total {total} logs
            </p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 mb-5">

        {/* Action tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {ACTION_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setAction(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filters.action === tab.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Entity filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Entity:</span>
          {(['all', 'users', 'accounts', 'transactions'] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEntity(e)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors
                ${filters.entity === e
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
            >
              {e === 'all' ? 'All' : ENTITY_LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchLogs} />}
      {!loading && !error && (
        <>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg className="w-10 h-10 text-gray-300" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-400">No audit logs found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              {/* Table header */}
              <div className="grid grid-cols-[1.1fr_1fr_1.4fr_1.4fr_1.6fr_0.9fr] gap-3
                px-5 py-3 bg-gray-50 border-b border-gray-100
                text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span>Time</span>
                <span>Action</span>
                <span>Actor</span>
                <span>Target</span>
                <span>Detail</span>
                <span>Status</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] ?? {
                    label: log.action,
                    color: 'bg-gray-100 text-gray-500',
                  };
                  const actor = getActorInfo(log);
                  const target = getTargetInfo(log);
                  const detail = getDetailInfo(log);
                  const status = valueOf(log, 'status');

                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1.1fr_1fr_1.4fr_1.4fr_1.6fr_0.9fr]
                        gap-3 items-start px-5 py-3.5
                        hover:bg-gray-50 transition-colors"
                    >
                      {/* Thời gian */}
                      <div>
                        <p className="text-xs text-gray-700 font-medium">
                          {formatDate(log.created_at)}
                        </p>
                        {log.ip_address && (
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                            {log.ip_address}
                          </p>
                        )}
                      </div>

                      {/* Action badge */}
                      <div>
                        <span className={`inline-flex text-xs font-semibold
                          px-2 py-0.5 rounded-full ${actionCfg.color}`}>
                          {actionCfg.label}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {log.entity ? ENTITY_LABEL[log.entity] : '—'}
                        </p>
                      </div>

                      {/* Actor */}
                      <div>
                        <p className="text-xs text-gray-700 font-semibold">
                          {actor.primary}
                        </p>
                        {actor.secondary && (
                          <p className="text-[11px] text-gray-400 mt-0.5 break-words">
                            {actor.secondary}
                          </p>
                        )}
                      </div>

                      {/* Target */}
                      <div>
                        <p className="text-xs text-gray-700 font-semibold">
                          {target.primary}
                        </p>
                        {target.secondary && (
                          <p className="text-[11px] text-gray-400 mt-0.5 break-words">
                            {target.secondary}
                          </p>
                        )}
                      </div>

                      {/* Entity ID */}
                      {/* <div>
                        <span
                          className="text-xs font-mono text-gray-500"
                          title={log.entity_id ?? ''}
                        >
                          {truncate(log.entity_id)}
                        </span>
                      </div> */}

                      {/* Detail */}
                      <div>
                        <p className="text-xs text-gray-700 font-medium">
                          {detail.primary}
                        </p>
                        {detail.secondary && (
                          <p className="text-[11px] text-gray-400 mt-0.5 break-words">
                            {detail.secondary}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        {formatStatus(status)}
                        
                        {/* {log.entity_id && (
                          <p className="text-[11px] text-gray-400 mt-1 font-mono" title={log.entity_id}>
                            #{truncate(log.entity_id, 8)}
                          </p>
                        )} */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-400">
                Trang {filters.page}/{totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((filters.page ?? 1) - 1)}
                  disabled={filters.page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200
                    text-gray-600 hover:bg-gray-50 disabled:opacity-40
                    disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((filters.page ?? 1) + 1)}
                  disabled={filters.page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200
                    text-gray-600 hover:bg-gray-50 disabled:opacity-40
                    disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
