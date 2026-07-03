// src/pages/Transfer/TransferPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import AppLayout from '../../components/AppLayout';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import transactionService from '../../services/transaction.service';
import type { TransferResponse } from '../../types/transaction.type';

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

  // idempotency_key sinh 1 lần duy nhất cho mỗi lần submit
  // reset lại khi user quay về form để tạo giao dịch mới
  const [idempotencyKey, setIdempotencyKey] = useState(() => uuidv4());

  const handleChange = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

  // ── VALIDATE ──────────────────────────────────────────────
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

  // ── BƯỚC 1: sang màn xác nhận ────────────────────────────
  const handleReview = () => {
    if (validate()) setPageState('confirm');
  };

  // ── BƯỚC 2: thực hiện chuyển khoản ───────────────────────
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

      // Map lỗi từ backend sang tiếng Việt thân thiện
      const errorMap: Record<string, string> = {
        'Số dư không đủ để thực hiện giao dịch': 'Insufficient account balance.',
        'Tài khoản đích không tồn tại': 'Recipient account does not exist.',
        'Tài khoản đích đang bị khóa, không thể nhận tiền': 'Recipient account is locked.',
        'Không thể chuyển khoản vào chính tài khoản của bạn': 'Cannot transfer to your own account.',
        'Tài khoản của bạn đang bị khóa': 'Your account is locked, cannot perform transactions.',
      };

      setErrors({
        general: errorMap[message] ?? 'An error occurred while processing the transaction. Please try again later.',
      });
      // Quay về form để user sửa
      setPageState('form');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset toàn bộ để chuyển khoản mới ────────────────────
  const handleReset = () => {
    setForm({ to_account_number: '', amount: '', description: '' });
    setErrors({});
    setResult(null);
    setIdempotencyKey(uuidv4()); // sinh key mới cho giao dịch tiếp theo
    setPageState('form');
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Transfer Money</h1>

      <div className="max-w-lg">

        {/* ── FORM ── */}
        {pageState === 'form' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                {errors.general}
              </div>
            )}

            <InputField
              label="Type the recipient's account number"
              placeholder="Enter the recipient's account number (9–12 digits)"
              value={form.to_account_number}
              onChange={handleChange('to_account_number')}
              error={errors.to_account_number}
            />

            <InputField
              label="Transfer Amount (VND)"
              placeholder="e.g., 500000"
              value={form.amount}
              onChange={handleChange('amount')}
              error={errors.amount}
            />

            {/* Preview số tiền đã format */}
            {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
              <p className="text-sm text-blue-600 font-medium -mt-3">
                ≈ {formatVND(form.amount)}
              </p>
            )}

            <InputField
              label="Transfer Description (Optional)"
              placeholder="e.g., Payment for lunch"
              value={form.description}
              onChange={handleChange('description')}
            />

            <Button fullWidth onClick={handleReview}>
              Continue to Confirmation
            </Button>
          </div>
        )}

        {/* ── XÁC NHẬN ── */}
        {pageState === 'confirm' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">Confirm Transaction</h2>
              <p className="text-sm text-gray-400 mt-1">Please review the details before confirming</p>
            </div>

            {/* Chi tiết giao dịch */}
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
              {[
                { label: 'Recipient Account', value: <span className="font-mono">{form.to_account_number}</span> },
                {
                  label: 'Amount',
                  value: (
                    <span className="text-red-500 font-bold text-base">
                      -{formatVND(form.amount)}
                    </span>
                  ),
                },
                { label: 'Description', value: form.description.trim() || <span className="text-gray-400 italic">None</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                disabled={loading}
                onClick={() => setPageState('form')}
              >
                Back
              </Button>
              <Button
                fullWidth
                loading={loading}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {/* ── THÀNH CÔNG ── */}
        {pageState === 'success' && result && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-5 text-center">

            {/* Checkmark */}
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">Transfer Successful!</h2>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(result.transaction.created_at).toLocaleString('vi-VN')}
              </p>
            </div>

            {/* Chi tiết kết quả */}
            <div className="w-full bg-gray-50 rounded-xl divide-y divide-gray-100">
              {[
                { label: 'Amount', value: <span className="text-red-500 font-semibold">-{formatVND(result.transaction.amount)}</span> },
                { label: 'Remaining Balance', value: <span className="font-semibold text-gray-900">{formatVND(result.new_balance)}</span> },
                { label: 'Transaction ID', value: <span className="font-mono text-xs text-gray-500">{result.transaction.id}</span> },
                {
                  label: 'Description',
                  value: result.transaction.description || <span className="text-gray-400 italic">None</span>,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="outline" fullWidth onClick={() => navigate('/history')}>
                View History
              </Button>
              <Button fullWidth onClick={handleReset}>
                Make New Transfer
              </Button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}