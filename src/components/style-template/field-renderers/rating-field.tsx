'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingFieldProps {
  value: string;
  onChange: (v: string) => void;
}

// 별점 입력 컴포넌트 (1~5, 0.5 단위)
export function RatingField({ value, onChange }: RatingFieldProps) {
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
