// src/pages/Transfer/TransferPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '../../components/AppLayout';
import transactionService from '../../services/transaction.service';
import type { TransferResponse } from '../../types/transaction.types';

// components
import TransferHeader from '../../components/transfer/TransferComponents/TransferHeader';

// screen components
import TransferForm from '../../components/transfer/TransferScreen/TransferForm';
import TransferConfirm  from '../../components/transfer/TransferScreen/TransferConfirm';
import TransferSuccess from '../../components/transfer/TransferScreen/TransferSuccess';

// constants
import { TRANSFER_ERROR_MAP, DEFAULT_TRANSFER_ERROR } from '../../constants/errorTransferMessage';

interface FormState {
  to_account_number: string;
  amount: string;
  description: string;
}

interface FormErrors {
  to_account_number?: string;
  amount?: string;
  general?: string;
}

type PageState = 'form' | 'confirm' | 'success';

function formatVND(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export default function TransferPage() {
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('form');
  const [form, setForm] = useState<FormState>({
    to_account_number: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => uuidv4());

  const handleChange = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.to_account_number.trim()) {
      newErrors.to_account_number = 'Please enter the recipient account number';
    } else if (!/^\d{9,12}$/.test(form.to_account_number.trim())) {
      newErrors.to_account_number = 'Invalid account number (9–12 digits)';
    }

    const amountNum = parseFloat(form.amount);
    if (!form.amount.trim()) {
      newErrors.amount = 'Please enter the transfer amount';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim())) {
      newErrors.amount = 'Amount can have at most 2 decimal places';
    } else if (amountNum > 999_999_999_999.99) {
      newErrors.amount = 'Amount exceeds the allowed limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReview = () => {
    if (validate()) setPageState('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await transactionService.transfer({
        to_account_number: form.to_account_number.trim(),
        amount: parseFloat(form.amount),
        description: form.description.trim() || undefined,
        idempotency_key: idempotencyKey,
      });

      setResult(res);
      setPageState('success');
    } catch (err: any) {
      const message = err.response?.data?.message;
      setErrors({
        general: TRANSFER_ERROR_MAP[message] ?? DEFAULT_TRANSFER_ERROR,
      });
      setPageState('form');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ to_account_number: '', amount: '', description: '' });
    setErrors({});
    setResult(null);
    setIdempotencyKey(uuidv4());
    setPageState('form');
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-4">
        
        {/* Tiêu đề, thanh tiến trình */}
        <TransferHeader pageState={pageState} />

        {/* Screen 1: Form */}
       {pageState === 'form' && (
          <TransferForm 
            form={form} 
            errors={errors} 
            onChange={handleChange} 
            onReview={handleReview} 
            formatVND={formatVND} 
          />
        )}

        {/* Screen 2: Confirmation */}
        {pageState === 'confirm' && (
          <TransferConfirm
            form={form}
            loading={loading}
            onBack={() => setPageState('form')}
            onConfirm={handleConfirm}
            formatVND={formatVND}
          />
        )}

        {/* Screen 3: Successful Transfer (Receipt) */}
        {pageState === 'success' && result && (
          <TransferSuccess 
            result={result} 
            onViewHistory={() => navigate('/history')} 
            onNewTransfer={handleReset} 
            formatVND={formatVND} 
          />
        )}

      </div>
    </AppLayout>
  );
}