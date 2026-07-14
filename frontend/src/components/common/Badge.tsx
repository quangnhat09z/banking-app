// src/components/common/Badge.tsx
interface Props {
  label: string;
  variant: 'green' | 'red' | 'blue' | 'gray' | 'orange' | 'purple';
}

const variantMap = {
  green:  'bg-green-50 text-green-600',
  red:    'bg-red-50 text-red-500',
  blue:   'bg-blue-50 text-blue-600',
  gray:   'bg-gray-100 text-gray-500',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function Badge({ label, variant }: Props) {
  return (
    <span className={`inline-flex items-center text-xs font-medium
      px-2 py-0.5 rounded-full ${variantMap[variant]}`}>
      {label}
    </span>
  );
}