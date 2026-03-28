'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { SeoAnalysis } from '@/lib/types';

const statusIcon = {
  good: <CheckCircle className="h-4 w-4 text-success" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  info: <Info className="h-4 w-4 text-info" />,
};

interface SeoScoreProps {
  analysis: SeoAnalysis;
}

export function SeoScore({ analysis }: SeoScoreProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const percentage = Math.round((analysis.score / analysis.maxScore) * 100);
  const color = percentage >= 80 ? 'text-success' : percentage >= 60 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-bold ${color}`}>{analysis.score}</div>
        <div className="text-sm text-muted-foreground">/ {analysis.maxScore} 네이버 SEO 점수</div>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className={`h-2 rounded-full transition-all ${percentage >= 80 ? 'bg-success' : percentage >= 60 ? 'bg-warning' : 'bg-destructive'}`}
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

      {/* 개선 제안 패널 */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Lightbulb className="h-4 w-4" />
            개선 제안 ({analysis.suggestions.length}건)
            {showSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showSuggestions && (
            <ul className="mt-2 space-y-1.5">
              {analysis.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 shrink-0 text-primary">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
