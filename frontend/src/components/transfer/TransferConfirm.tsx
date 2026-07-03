
import Button from '../Button';

interface FormState {
  to_account_number: string;
  amount: string;
  description: string;
}

interface TransferConfirmProps {
  form: FormState;
  loading: boolean;
  onBack: () => void;
  onConfirm: () => void;
  formatVND: (value: string | number) => string;
}

export default function TransferConfirm({ form, loading, onBack, onConfirm, formatVND }: TransferConfirmProps) {
    return (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col gap-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Confirm Order Details</h2>
              <p className="text-sm text-gray-400 mt-0.5">Double check account details to secure funds</p>
            </div>

            {/* Khung tóm tắt chi tiết */}
            <div className="bg-gray-50 border border-gray-200/50 rounded-xl overflow-hidden divide-y divide-gray-200/60">
              {[
                { label: 'Recipient Account', value: <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200/60 text-gray-800 text-xs font-bold">{form.to_account_number}</span> },
                {
                  label: 'Total Amount',
                  value: <span className="text-rose-600 font-extrabold text-base">-{formatVND(form.amount)}</span>,
                },
                { label: 'Description', value: form.description.trim() || <span className="text-gray-400 italic text-xs">No description attached</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth disabled={loading} onClick={onBack}>
                Back
              </Button>
              <Button fullWidth loading={loading} onClick={onConfirm}>
                Authorize Transfer
              </Button>
            </div>
          </div>
        )
}