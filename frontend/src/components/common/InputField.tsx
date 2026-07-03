// src/components/InputField.tsx
interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

export default function InputField({
  label, type = 'text', placeholder, value, onChange, error, disabled,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          px-3 py-2 rounded-lg border text-sm outline-none transition
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
        `}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}