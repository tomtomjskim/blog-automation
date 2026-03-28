'use client';

import { Button } from '@/components/ui/button';

interface ToggleFieldProps {
  value: string;
  onChange: (v: string) => void;
}

// 3버튼 토글 (O / X / 조건부)
export function ToggleField({ value, onChange }: ToggleFieldProps) {
  const options = ['O', 'X', '조건부'];
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <Button
          key={opt}
          type="button"
          size="sm"
          variant={value === opt ? 'default' : 'outline'}
          className="h-8 px-3 text-xs"
          onClick={() => onChange(value === opt ? '' : opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}
