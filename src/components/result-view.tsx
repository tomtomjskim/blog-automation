'use client';

import { Copy, RefreshCw, History, Clock, DollarSign, FileText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownPreview } from './markdown-preview';
import { SeoScore } from './seo-score';
import { analyzeSEO } from '@/lib/seo-analyzer';
import type { GenerationRecord } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ResultViewProps {
  data: GenerationRecord;
}

export function ResultView({ data }: ResultViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const seoAnalysis = data.content ? analyzeSEO(data.content, data.keywords) : null;

  const handleCopy = async () => {
    if (data.content) {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{data.style}</Badge>
        <Badge variant="secondary">{data.mode === 'quality' ? '고품질' : '빠른 생성'}</Badge>
        {data.charCount && (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {data.charCount.toLocaleString()}자
          </Badge>
        )}
        {data.readTime && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {data.readTime}분
          </Badge>
        )}
        {data.durationSec > 0 && (
          <Badge variant="outline" className="gap-1">
            <Hash className="h-3 w-3" />
            {data.durationSec}초
          </Badge>
        )}
        {data.costUsd > 0 && (
          <Badge variant="outline" className="gap-1">
            <DollarSign className="h-3 w-3" />
            ${data.costUsd.toFixed(4)}
          </Badge>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm">
          <Copy className="mr-1.5 h-4 w-4" />
          {copied ? '복사됨!' : '복사'}
        </Button>
        <Button onClick={() => router.push('/')} variant="outline" size="sm">
          <RefreshCw className="mr-1.5 h-4 w-4" />
          새로 생성
        </Button>
        <Button onClick={() => router.push('/history')} variant="outline" size="sm">
          <History className="mr-1.5 h-4 w-4" />
          히스토리
        </Button>
      </div>

      {/* 마크다운 프리뷰 */}
      <Card>
        <CardContent className="p-6">
          {data.content ? (
            <MarkdownPreview content={data.content} />
          ) : (
            <p className="text-muted-foreground">내용 없음</p>
          )}
        </CardContent>
      </Card>

      {/* SEO 분석 */}
      {seoAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <SeoScore analysis={seoAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* 토큰 사용량 */}
      {(data.inputTokens > 0 || data.outputTokens > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">사용량 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground">입력 토큰</div>
                <div className="font-medium">{data.inputTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">출력 토큰</div>
                <div className="font-medium">{data.outputTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">비용</div>
                <div className="font-medium">${data.costUsd.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">소요시간</div>
                <div className="font-medium">{data.durationSec}초</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
