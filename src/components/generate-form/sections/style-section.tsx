'use client';

import { Card, CardContent } from '@/components/ui/card';
import { STYLE_OPTIONS } from '@/lib/prompts';
import type { StyleId, TemplateField } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CustomStyle {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  systemPrompt: string;
  fields: TemplateField[];
}

interface StyleSectionProps {
  style: StyleId;
  setStyle: (v: StyleId) => void;
  customStyles: CustomStyle[];
}

export function StyleSection({ style, setStyle, customStyles }: StyleSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">글쓰기 스타일</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="글쓰기 스타일 선택">
        {STYLE_OPTIONS.map((opt) => {
          const isSelected = style === opt.id;
          return (
            <Card
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              className={cn(
                'cursor-pointer transition-all duration-200',
                isSelected
                  ? 'ring-2 ring-primary/50 bg-primary/5 scale-[0.98]'
                  : 'hover:bg-accent/40 hover:shadow-sm',
              )}
              onClick={() => setStyle(opt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setStyle(opt.id);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{opt.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{opt.name}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {customStyles.map((cs) => {
          const customId = `custom:${cs.id}` as StyleId;
          const isSelected = style === customId;
          return (
            <Card
              key={`custom-${cs.id}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              className={cn(
                'cursor-pointer transition-all duration-200',
                isSelected
                  ? 'ring-2 ring-primary/50 bg-primary/5 scale-[0.98]'
                  : 'hover:bg-accent/40 hover:shadow-sm',
              )}
              onClick={() => setStyle(customId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setStyle(customId);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cs.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{cs.name}</div>
                    <div className="text-xs text-muted-foreground">{cs.description || '커스텀 스타일'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
