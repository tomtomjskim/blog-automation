'use client';

import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  filled: number;
  total: number;
}

// 입력 진행도를 표시하는 점 인디케이터
export function ProgressDots({ filled, total }: ProgressDotsProps) {
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
