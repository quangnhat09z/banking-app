// src/pages/History/HistoryPage.tsx
import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import transactionService from '../../services/transaction.service';
import type { Transaction, TransactionPagination, TransactionDirection } from '../../types/transaction.types';
import Pagination from '../../components/common/Pagination';

function formatVND(amount: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(parseFloat(amount));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const DIRECTION_TABS: { label: string; value: TransactionDirection }[] = [
  { label: 'All Transactions', value: 'all' },
  { label: 'Money Out', value: 'sent' },
  { label: 'Money In', value: 'received' },
];

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<TransactionPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>('all');
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await transactionService.getHistory({ page, limit: LIMIT, direction });
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch {
      setError('Cannot fetch transaction history.');
    } finally {
      setLoading(false);
    }
  }, [page, direction]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDirectionChange = (value: TransactionDirection) => {
    setDirection(value);
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaction History</h1>
            {/* <p className="text-sm text-gray-500 mt-1">Monitor and download your recent banking activities</p> */}
          </div>

          {/* Tabs bộ lọc */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit shrink-0 border border-gray-200/50">
            {DIRECTION_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleDirectionChange(tab.value)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200
                  ${direction === tab.value
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Khối nội dung chính */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Spinner />
          </div>
        )}
        
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <ErrorMessage message={error} onRetry={fetchHistory} />
          </div>
        )}

        {!loading && !error && (
          <>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No transactions recorded</p>
                <p className="text-xs text-gray-400 mt-1">Try switching between money in/out tabs</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all">
                <div className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Cột trái: Icon hành động */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                          ${tx.direction === 'received' 
                            ? 'bg-emerald-50/60 border-emerald-100 text-emerald-600' 
                            : 'bg-rose-50/60 border-rose-100 text-rose-600'}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" 
                              d={tx.direction === 'received' ? 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3' : 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18'} 
                            />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {tx.direction === 'received' ? 'Transfer From' : 'Transfer To'}{' '}
                            <span className="font-mono bg-gray-50 border border-gray-200/60 text-gray-700 px-1.5 py-0.5 rounded text-xs ml-1">
                              {tx.counterparty_account}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-medium line-clamp-1">
                            {tx.description || 'No transfer purpose details'}
                          </p>
                        </div>
                      </div>

                      {/* Cột phải: Số tiền + Thời gian & Badge Trạng thái */}
                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div>
                          <p className={`text-base font-bold tracking-tight
                            ${tx.direction === 'received' ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {tx.direction === 'received' ? '+' : '-'}{formatVND(tx.amount)}
                          </p>
                          <p className="text-[11px] font-medium text-gray-400 mt-1">
                            {formatDate(tx.created_at)}
                          </p>
                        </div>

                        {/* Tách trạng thái thành các Badge tinh gọn */}
                        <div className="w-20 flex justify-end">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border tracking-wide
                            ${tx.status === 'success' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : tx.status === 'pending' 
                                ? 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                                : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                            {tx.status === 'success' ? 'Success' : tx.status === 'pending' ? 'Pending' : 'Failed'}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phân trang */}
            <Pagination  pagination={pagination} onPageChange={(targetPage) => setPage(targetPage)} />
          </>
        )}
      </div>
    </AppLayout>
  );
}