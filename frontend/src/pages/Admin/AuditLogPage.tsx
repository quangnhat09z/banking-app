// src/pages/Admin/AuditLogPage.tsx
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import JsonViewer from '../../components/common/JsonViewer';
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
              {e === 'all' ? 'Tất cả' : ENTITY_LABEL[e]}
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
              <p className="text-sm text-gray-400">Không có bản ghi nào</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              {/* Table header */}
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr] gap-3
                px-5 py-3 bg-gray-50 border-b border-gray-100
                text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span>Time</span>
                <span>Action</span>
                <span>Entity</span>
                <span>Actor ID</span>
                <span>Entity ID</span>
                <span>Before</span>
                <span>After</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] ?? {
                    label: log.action,
                    color: 'bg-gray-100 text-gray-500',
                  };

                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr]
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
                      </div>

                      {/* Entity */}
                      <div>
                        <span className="text-xs text-gray-500 font-medium">
                          {log.entity ? ENTITY_LABEL[log.entity] : '—'}
                        </span>
                      </div>

                      {/* Actor ID */}
                      <div>
                        <span
                          className="text-xs font-mono text-gray-500"
                          title={log.actor_id ?? ''}
                        >
                          {truncate(log.actor_id)}
                        </span>
                      </div>

                      {/* Entity ID */}
                      <div>
                        <span
                          className="text-xs font-mono text-gray-500"
                          title={log.entity_id ?? ''}
                        >
                          {truncate(log.entity_id)}
                        </span>
                      </div>

                      {/* Before data */}
                      <div>
                        <JsonViewer
                          data={log.before_data}
                          label="before"
                          variant="before"
                        />
                      </div>

                      {/* After data */}
                      <div>
                        <JsonViewer
                          data={log.after_data}
                          label="after"
                          variant="after"
                        />
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