'use client';

import type { SeoAnalysis } from '@/lib/types';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const statusIcon = {
  good: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

interface SeoScoreProps {
  analysis: SeoAnalysis;
}

export function SeoScore({ analysis }: SeoScoreProps) {
  const percentage = Math.round((analysis.score / analysis.maxScore) * 100);
  const color = percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-bold ${color}`}>{analysis.score}</div>
        <div className="text-sm text-muted-foreground">/ {analysis.maxScore} SEO 점수</div>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className={`h-2 rounded-full transition-all ${percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="space-y-2">
        {analysis.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {statusIcon[item.status]}
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
