'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Star, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getStyleTemplate, getStyleAutoExpand } from '@/lib/style-templates';
import type { StyleId, TemplateData, TemplateField } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Preset {
  id: string;
  name: string;
  type: string;
  style: string;
  data: Record<string, string>;
}

interface StyleTemplateFieldsProps {
  style: StyleId;
  data: TemplateData;
  onChange: (data: TemplateData) => void;
  customFields?: TemplateField[];
}

// 별점 입력 컴포넌트 (1~5, 0.5 단위)
function RatingField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = parseFloat(value) || 0;

  const handleClick = (star: number, isHalf: boolean) => {
    const newVal = isHalf ? star - 0.5 : star;
    // 같은 값 클릭 시 초기화
    if (newVal === current) {
      onChange('');
    } else {
      onChange(String(newVal));
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = current >= star;
        const half = !filled && current >= star - 0.5;
        return (
          <span key={star} className="relative inline-block cursor-pointer">
            {/* 왼쪽 반 클릭 영역 (0.5점) */}
            <span
              className="absolute left-0 top-0 h-full w-1/2 z-10"
              onClick={() => handleClick(star, true)}
            />
            {/* 오른쪽 반 클릭 영역 (1점) */}
            <span
              className="absolute right-0 top-0 h-full w-1/2 z-10"
              onClick={() => handleClick(star, false)}
            />
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                filled ? 'fill-yellow-400 text-yellow-400' :
                half ? 'fill-yellow-200 text-yellow-400' :
                'fill-none text-muted-foreground',
              )}
            />
          </span>
        );
      })}
      {value && (
        <span className="ml-1 text-xs text-muted-foreground">{value}/5</span>
      )}
    </div>
  );
}

// 3버튼 토글 (O / X / 조건부)
function ToggleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

// 셀렉트 드롭다운
function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
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

// 필드 단일 렌더링
function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
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

// 프로그레스 도트
function ProgressDots({ filled, total }: { filled: number; total: number }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            i < filled ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        />
      ))}
    </div>
  );
}

export function StyleTemplateFields({ style, data, onChange, customFields }: StyleTemplateFieldsProps) {
  const isCustom = style.startsWith('custom:');
  const autoExpand = isCustom ? true : getStyleAutoExpand(style);
  const [open, setOpen] = useState(autoExpand);
  const fields = customFields && customFields.length > 0
    ? [...customFields, ...getStyleTemplate('casual').filter(f => f.key === 'freeform')]
    : getStyleTemplate(style);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');

  // 스타일 전환 시 autoExpand에 따라 패널 상태 갱신
  useEffect(() => {
    setOpen(autoExpand);
  }, [style, autoExpand]);

  // 프리셋 목록 로드
  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch(`/api/form-presets?style=${style}&type=template`);
      const data = await res.json();
      setPresets(data);
    } catch {}
  }, [style]);

  useEffect(() => {
    fetchPresets();
    setSelectedPresetId('');
  }, [fetchPresets]);

  const handleSavePreset = async () => {
    const name = prompt('프리셋 이름을 입력하세요:');
    if (!name?.trim()) return;
    try {
      await fetch('/api/form-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type: 'template', style, data }),
      });
      fetchPresets();
    } catch {}
  };

  const handleLoadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onChange({ ...data, ...preset.data });
    }
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('프리셋을 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/form-presets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: presetId }),
      });
      if (selectedPresetId === presetId) setSelectedPresetId('');
      fetchPresets();
    } catch {}
  };

  const styleFields = fields.filter(f => f.key !== 'freeform');
  const freeformField = fields.find(f => f.key === 'freeform');

  const handleChange = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const filledCount = styleFields.filter(f => data[f.key]?.trim()).length;

  // 그룹별로 필드 묶기
  const groupedFields: { groupName: string | undefined; fields: TemplateField[] }[] = [];
  for (const field of styleFields) {
    const last = groupedFields[groupedFields.length - 1];
    if (!last || last.groupName !== field.group) {
      groupedFields.push({ groupName: field.group, fields: [field] });
    } else {
      last.fields.push(field);
    }
  }

  return (
    <div className="space-y-3">
      {/* 스타일별 전용 필드 (접기/펼치기) */}
      {styleFields.length > 0 && (
        <div className="rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <span>
              추가 입력 항목
              {filledCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filledCount}/{styleFields.length}개 입력됨)
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {!open && (
                <ProgressDots filled={filledCount} total={styleFields.length} />
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  open && 'rotate-180',
                )}
              />
            </div>
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            {/* 프리셋 드롭다운 */}
            {presets.length > 0 || filledCount > 0 ? (
              <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                <select
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                  value={selectedPresetId}
                  onChange={(e) => handleLoadPreset(e.target.value)}
                >
                  <option value="">프리셋 선택...</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedPresetId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => handleDeletePreset(selectedPresetId, e)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                {filledCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 text-xs"
                    onClick={handleSavePreset}
                  >
                    <Save className="mr-1 h-3 w-3" />
                    저장
                  </Button>
                )}
              </div>
            ) : null}
            <div className="px-4 pb-4 space-y-4">
              {groupedFields.map(({ groupName, fields: gFields }) => (
                <div key={groupName ?? '__nogroup'}>
                  {groupName && (
                    <div className="mb-2 mt-1">
                      <p className="text-xs font-medium text-muted-foreground">{groupName}</p>
                      <div className="mt-1 h-px bg-border" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {gFields.map((field) => (
                      <div
                        key={field.key}
                        className={cn(
                          field.type === 'textarea' && 'sm:col-span-2',
                          (field.type === 'rating' || field.type === 'toggle') && 'sm:col-span-2',
                        )}
                      >
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          {field.label}
                        </label>
                        <FieldRenderer
                          field={field}
                          value={data[field.key] || ''}
                          onChange={handleChange}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="px-4 pb-3 text-xs text-muted-foreground">
              비어있는 항목은 AI가 자유롭게 작성합니다 (추측 정보는 제외)
            </p>
          </div>
        </div>
      )}

      {/* 자유 입력 (항상 표시) */}
      {freeformField && (
        <div className="space-y-2">
          <label className="text-sm font-medium">추가 정보 (선택)</label>
          <Textarea
            placeholder={freeformField.placeholder}
            value={data[freeformField.key] || ''}
            onChange={(e) => handleChange(freeformField.key, e.target.value)}
            rows={freeformField.rows || 2}
          />
        </div>
      )}
    </div>
  );
}
