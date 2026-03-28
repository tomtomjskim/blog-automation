'use client';

interface SelectFieldProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}

// 셀렉트 드롭다운
export function SelectField({ value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <select
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
