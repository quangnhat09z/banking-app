// src/components/ConfirmModal.tsx
import Button from './Button';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, message, confirmLabel, loading, onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" disabled={loading} onClick={onCancel}>
            Cancel
          </Button>
          <Button loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}