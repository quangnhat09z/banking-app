
import Button from '../Button';
import type { TransferResponse } from '../../types/transaction.type';

interface TransferSuccessProps {
  result: TransferResponse;
  onViewHistory: () => void;
  onNewTransfer: () => void;
  formatVND: (value: string | number) => string;
}

export default function TransferSuccess({ result, onViewHistory, onNewTransfer, formatVND }: TransferSuccessProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md flex flex-col items-center gap-6 text-center relative overflow-hidden animate-fade-in">
            {/* Thanh màu trang trí đỉnh hóa đơn */}
            <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />

            {/* Vòng tròn Checkmark thành công */}
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900">Transfer Successful!</h2>
                <p className="text-xs font-medium text-gray-400 mt-1">
                    {new Date(result.transaction.created_at).toLocaleString('vi-VN')}
                </p>
            </div>

            {/* Chi tiết biên lai nhận diện ngân hàng */}
            <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-xl divide-y divide-gray-100 p-2">
                {[
                    { label: 'Amount Debited', value: <span className="text-rose-600 font-extrabold text-base">-{formatVND(result.transaction.amount)}</span> },
                    { label: 'New Balance', value: <span className="font-bold text-gray-900">{formatVND(result.new_balance)}</span> },
                    { label: 'Ref Transaction ID', value: <span className="font-mono text-xs font-semibold bg-white border border-gray-200/40 px-1.5 py-0.5 rounded text-gray-500">{result.transaction.id}</span> },
                    {
                        label: 'Content Message',
                        value: <p className="text-gray-700 font-medium max-w-[200px] truncate">{result.transaction.description || 'No description'}</p>,
                    },
                ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">{label}</span>
                        <span className="text-sm text-right">{value}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 w-full">
                <Button variant="outline" fullWidth onClick={onViewHistory}>
                    View History
                </Button>
                <Button fullWidth onClick={onNewTransfer}>
                    New Transfer
                </Button>
            </div>
        </div>
    )
}