'use client';

import { useState } from 'react';
import { Wand2, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NaturalizationChange } from '@/lib/types';

interface NaturalizationPanelProps {
  score: number | null;
  changes: NaturalizationChange[] | null;
  onRerun?: () => void;
  loading?: boolean;
}

export function NaturalizationPanel({ score, changes, onRerun, loading }: NaturalizationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (score === null) return null;

  const scoreColor = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
  const scoreBg = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4" />
            자연화 분석
          </CardTitle>
          {onRerun && (
            <Button onClick={onRerun} variant="outline" size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3 w-3" />
              )}
              재변환
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 점수 게이지 */}
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${scoreColor}`}>{score}</div>
            <div className="text-sm text-muted-foreground">/ 100 자연화 점수</div>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full transition-all ${scoreBg}`}
              style={{ width: `${score}%` }}
            />
          </div>

          {/* 변경 목록 */}
          {changes && changes.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                변경사항 {changes.length}건
              </button>
              {expanded && (
                <div className="mt-2 space-y-1.5">
                  {changes.map((change, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className="shrink-0">
                        {change.type === 'vocab' && '어휘'}
                        {change.type === 'sentence' && '문장'}
                        {change.type === 'experience' && '경험'}
                        {change.type === 'structure' && '구조'}
                      </Badge>
                      {change.original && (
                        <span className="line-through text-muted-foreground">{change.original}</span>
                      )}
                      <span>→</span>
                      <span className="text-green-600 dark:text-green-400">{change.replaced}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
