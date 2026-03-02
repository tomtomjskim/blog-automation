'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsData {
  summary: {
    totalGenerated: number;
    totalCompleted: number;
    totalPublished: number;
    avgSeoScore: number;
    totalCostUsd: number;
  };
  dailyStats: Array<{ date: string; count: number }>;
  styleStats: Array<{ style: string; count: number }>;
}

const STYLE_LABELS: Record<string, string> = {
  casual: '일상형', informative: '정보형', review: '리뷰형',
  food_review: '맛집리뷰', marketing: '마케팅형', story: '스토리형',
};

export default function DashboardPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!data) {
    return <p className="text-center text-muted-foreground">데이터를 불러올 수 없습니다.</p>;
  }

  const maxDaily = Math.max(...data.dailyStats.map(d => d.count), 1);
  const maxStyle = Math.max(...data.styleStats.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h1 className="text-xl font-bold">대시보드</h1>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">총 생성</span>
            </div>
            <div className="mt-1 text-2xl font-bold">{data.summary.totalGenerated}</div>
            <div className="text-xs text-muted-foreground">완료: {data.summary.totalCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">평균 SEO</span>
            </div>
            <div className="mt-1 text-2xl font-bold">{data.summary.avgSeoScore}</div>
            <div className="text-xs text-muted-foreground">/ 100점</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">발행</span>
            </div>
            <div className="mt-1 text-2xl font-bold">{data.summary.totalPublished}</div>
            <div className="text-xs text-muted-foreground">건</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">총 비용</span>
            </div>
            <div className="mt-1 text-2xl font-bold">${data.summary.totalCostUsd.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              평균 ${data.summary.totalCompleted > 0 ? (data.summary.totalCostUsd / data.summary.totalCompleted).toFixed(4) : '0'}/건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 일별 생성 차트 (CSS 바 차트) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 생성 (최근 30일)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
          ) : (
            <div className="flex items-end gap-1" style={{ height: 120 }}>
              {data.dailyStats.map((d, i) => (
                <div key={i} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{ height: `${(d.count / maxDaily) * 100}px` }}
                  />
                  <div className="absolute -top-5 hidden text-xs font-medium group-hover:block">{d.count}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 스타일 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">스타일별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.styleStats.map(s => (
              <div key={s.style} className="flex items-center gap-3">
                <span className="w-20 text-sm">{STYLE_LABELS[s.style] || s.style}</span>
                <div className="flex-1">
                  <div
                    className="h-4 rounded bg-primary/70"
                    style={{ width: `${(s.count / maxStyle) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
