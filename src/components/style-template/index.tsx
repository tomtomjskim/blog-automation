'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { getStyleTemplate, getStyleAutoExpand } from '@/lib/style-templates';
import type { StyleId, TemplateData, TemplateField } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FieldRenderer } from './field-renderers/field-renderer';
import { PresetDropdown } from './preset-manager/preset-dropdown';
import { usePresets } from './preset-manager/use-presets';
import { ProgressDots } from './progress-dots';

interface StyleTemplateFieldsProps {
  style: StyleId;
  data: TemplateData;
  onChange: (data: TemplateData) => void;
  customFields?: TemplateField[];
}

export function StyleTemplateFields({ style, data, onChange, customFields }: StyleTemplateFieldsProps) {
  const isCustom = style.startsWith('custom:');
  const autoExpand = isCustom ? true : getStyleAutoExpand(style);
  const [open, setOpen] = useState(autoExpand);
  const fields = customFields && customFields.length > 0
    ? [...customFields, ...getStyleTemplate('casual').filter(f => f.key === 'freeform')]
    : getStyleTemplate(style);

  // 스타일 전환 시 autoExpand에 따라 패널 상태 갱신
  useEffect(() => {
    setOpen(autoExpand);
  }, [style, autoExpand]);

  const styleFields = fields.filter(f => f.key !== 'freeform');
  const freeformField = fields.find(f => f.key === 'freeform');

  const handleChange = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const filledCount = styleFields.filter(f => data[f.key]?.trim()).length;

  const { presets, selectedPresetId, handleSavePreset, handleLoadPreset, handleDeletePreset } =
    usePresets({ style, data, onChange });

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
            <PresetDropdown
              presets={presets}
              selectedPresetId={selectedPresetId}
              filledCount={filledCount}
              onLoad={handleLoadPreset}
              onSave={handleSavePreset}
              onDelete={handleDeletePreset}
            />
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
