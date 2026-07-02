// src/pages/Dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
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

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-6">My Account</h1>

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} onRetry={fetchAccount} />}
      {!loading && account && (
        <div className="flex flex-col gap-4">

          {/* Số dư */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white">
            <p className="text-sm text-blue-100 mb-1">Available Balance</p>
            <p className="text-3xl font-bold tracking-tight">{formatVND(account.balance)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-blue-100">STK:</span>
              <span className="font-mono font-semibold tracking-widest">
                {account.account_number}
              </span>
            </div>
          </div>

          {/* Chi tiết */}
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {[
              { label: 'Currency Type', value: account.currency },
              {
                label: 'Status',
                value: (
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium
                    ${account.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full
                      ${account.status === 'active' ? 'bg-green-500' : 'bg-red-400'}`} />
                    {account.status === 'active' ? 'Active' : 'Locked'}
                  </span>
                ),
              },
              {
                label: 'Account Opening Date',
                value: new Date(account.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                }),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </AppLayout>
  );
}