// src/components/common/JsonViewer.tsx
import { useState } from 'react';

interface Props {
  data: Record<string, any> | null;
  label: string;
  variant?: 'before' | 'after';
}

export default function JsonViewer({ data, label, variant = 'after' }: Props) {
  const [open, setOpen] = useState(false);

  if (!data) {
    return (
      <span className="text-xs text-gray-300 italic">—</span>
    );
  }

  const colorMap = {
    before: 'text-orange-600 bg-orange-50 border-orange-100',
    after:  'text-green-600 bg-green-50 border-green-100',
  };

  const badgeMap = {
    before: 'bg-orange-100 text-orange-600',
    after:  'bg-green-100 text-green-600',
  };

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1 text-xs font-medium
          px-2 py-0.5 rounded-full border transition-colors ${badgeMap[variant]}`}
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <pre className={`mt-1.5 text-xs rounded-lg border px-3 py-2
          overflow-x-auto max-w-xs max-h-40 overflow-y-auto
          leading-relaxed ${colorMap[variant]}`}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}