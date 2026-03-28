'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TemplateField } from '@/lib/types';
import { RatingField } from './rating-field';
import { ToggleField } from './toggle-field';
import { SelectField } from './select-field';

interface FieldRendererProps {
  field: TemplateField;
  value: string;
  onChange: (key: string, value: string) => void;
}

// 필드 타입에 따른 단일 렌더링
export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const handleChange = (v: string) => onChange(field.key, v);

  if (field.type === 'rating') {
    return <RatingField value={value} onChange={handleChange} />;
  }
  if (field.type === 'toggle') {
    return <ToggleField value={value} onChange={handleChange} />;
  }
  if (field.type === 'select') {
    return (
      <SelectField
        value={value}
        onChange={handleChange}
        options={field.options || []}
        placeholder={field.placeholder}
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <Textarea
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={field.rows || 2}
      />
    );
  }
  return (
    <Input
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
