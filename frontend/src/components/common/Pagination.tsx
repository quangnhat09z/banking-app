// src/components/Pagination.tsx
import type { PaginationMeta } from '../../types/pagination.types';

interface PaginationProps {
  pagination: PaginationMeta | null;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 bg-white border border-gray-100 rounded-xl px-5 py-3 shadow-xs">
      {/* Thông tin số trang */}
      <p className="text-xs font-medium text-gray-400">
        Showing Page <span className="font-semibold text-gray-700">{pagination.page}</span> of{' '}
        <span className="font-semibold text-gray-700">{pagination.totalPages}</span> · Total{' '}
        <span className="font-semibold text-gray-700">{pagination.total}</span> items
      </p>

      {/* Nút bấm chuyển trang */}
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white shadow-xs"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white shadow-xs"
        >
          Next
        </button>
      </div>
    </div>
  );
}
