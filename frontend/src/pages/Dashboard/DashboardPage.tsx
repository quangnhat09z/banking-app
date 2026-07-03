// src/pages/Dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import accountService from '../../services/account.service';
import type { Account } from '../../types/account.types';

function formatVND(amount: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(parseFloat(amount));
}

export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchAccount = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getMyAccount();
      setAccount(data);
    } catch {
      setError('Cannot fetch account information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccount(); }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Account</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your digital financial identity</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        )}
        
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <ErrorMessage message={error} onRetry={fetchAccount} />
          </div>
        )}

        {!loading && account && (
          <div className="flex flex-col gap-6">

            {/* Thẻ số dư */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 border border-white/10 group">
              
              {/* Chi tiết họa tiết chìm mờ (Hệ thống bảo mật mạng) */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              
              {/* Hàng đầu: Nhãn & Logo Chip Thẻ */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-blue-200/70 font-medium">Available Balance</p>
                  <p className="text-3xl font-extrabold tracking-tight mt-1 transition-all duration-300">
                    {formatVND(account.balance)}
                  </p>
                </div>
                {/* Giả lập SIM Chip EMV Ngân hàng */}
                <div className="w-10 h-8 bg-amber-200/80 rounded-md border border-amber-300/50 flex flex-col gap-1 p-1.5 opacity-80 shadow-inner">
                  <div className="h-full w-full border-t border-b border-amber-600/30 grid grid-cols-3 gap-1" />
                </div>
              </div>

              {/* Hàng cuối: Thông tin Số tài khoản & Copy */}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-200/60 mb-0.5">Account Number</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold tracking-widest text-white/90">
                      {account.account_number}
                    </span>
                    <button 
                      onClick={() => handleCopy(account.account_number)}
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-blue-200 cursor-pointer"
                      title="Copy account number"
                    >
                      {copied ? (
                        <span className="text-[10px] font-semibold px-1 text-emerald-300 animate-fade-in">Copied!</span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {/* Giả lập mạng thẻ */}
                <div className="text-right font-semibold italic text-sm tracking-wide text-white/40 select-none">
                  DIGITAL PLATINUM
                </div>
              </div>
            </div>

            {/* hành động */}
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/transfer" 
                className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 shadow-xs transition duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9-7-9-7-9 7 9 7zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Send Money</p>
                  <p className="text-xs text-gray-400 mt-0.5">Instant local transfer</p>
                </div>
              </Link>

              <Link 
                to="/history" 
                className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 shadow-xs transition duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Statements</p>
                  <p className="text-xs text-gray-400 mt-0.5">View full history</p>
                </div>
              </Link>
            </div>

            {/* Thông tin tài khoản */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50/70 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Account Properties</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { label: 'Currency Unit', value: account.currency },
                  {
                    label: 'Account Status',
                    value: (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border
                        ${account.status === 'active' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${account.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {account.status === 'active' ? 'Active' : 'Locked'}
                      </span>
                    ),
                  },
                  {
                    label: 'Activation Date',
                    value: new Date(account.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    }),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/30 transition-colors">
                    <span className="text-sm font-medium text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}