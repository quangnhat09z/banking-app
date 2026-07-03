// src/components/ErrorMessage.tsx
interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="p-3 bg-red-50 rounded-full">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}