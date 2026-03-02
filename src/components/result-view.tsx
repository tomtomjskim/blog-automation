'use client';

import { Copy, RefreshCw, History, Clock, DollarSign, FileText, Hash, Image as ImageIcon, Send, BookOpen, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownPreview } from './markdown-preview';
import { NaverPreview } from './naver-preview';
import { SeoScore } from './seo-score';
import { NaturalizationPanel } from './naturalization-panel';
import { analyzeNaverSEO } from '@/lib/seo-analyzer';
import type { GenerationRecord } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ResultViewProps {
  data: GenerationRecord;
}

export function ResultView({ data }: ResultViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'markdown' | 'naver'>('markdown');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ url: string; type: string } | null>(null);
  const [publishError, setPublishError] = useState('');

  const seoAnalysis = data.content ? analyzeNaverSEO(data.content, data.keywords) : null;

  const handleCopy = async () => {
    if (data.content) {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublish = async (publishAs: 'draft' | 'published') => {
    setPublishing(true);
    setPublishError('');
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: data.id, publishAs }),
      });
      const result = await res.json();
      if (res.ok) {
        setPublishResult({ url: result.postUrl, type: publishAs });
      } else {
        setPublishError(result.error || '발행 실패');
      }
    } catch {
      setPublishError('서버 연결 실패');
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{data.style}</Badge>
        <Badge variant="secondary">{data.mode === 'quality' ? '고품질' : '빠른 생성'}</Badge>
        {data.tone && <Badge variant="secondary">{data.tone === 'haeyoche' ? '해요체' : '반말'}</Badge>}
        {data.persona && <Badge variant="secondary">{data.persona}</Badge>}
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
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm">
          <Copy className="mr-1.5 h-4 w-4" />
          {copied ? '복사됨!' : '마크다운 복사'}
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

      {/* 마크다운/네이버 뷰 토글 */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'markdown' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('markdown')}
        >
          <BookOpen className="mr-1.5 h-4 w-4" />
          마크다운
        </Button>
        <Button
          variant={viewMode === 'naver' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('naver')}
        >
          <FileText className="mr-1.5 h-4 w-4" />
          네이버 뷰
        </Button>
      </div>

      {/* 콘텐츠 프리뷰 */}
      {viewMode === 'markdown' ? (
        <Card>
          <CardContent className="p-6">
            {data.content ? (
              <MarkdownPreview content={data.content} />
            ) : (
              <p className="text-muted-foreground">내용 없음</p>
            )}
          </CardContent>
        </Card>
      ) : (
        data.content && <NaverPreview markdown={data.content} />
      )}

      {/* 네이버 포스팅 */}
      {data.content && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              네이버 블로그 포스팅
            </CardTitle>
          </CardHeader>
          <CardContent>
            {publishResult ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {publishResult.type === 'draft' ? '임시저장' : '게시'} 완료!
                </span>
                <a
                  href={publishResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  포스트 보기 <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : data.publishStatus === 'published' || data.publishStatus === 'draft' ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {data.publishStatus === 'draft' ? '임시저장됨' : '게시됨'}
                </span>
                {data.naverPostUrl && (
                  <a
                    href={data.naverPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    포스트 보기 <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={() => handlePublish('draft')} variant="outline" size="sm" disabled={publishing}>
                    {publishing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    임시저장
                  </Button>
                  <Button onClick={() => handlePublish('published')} size="sm" disabled={publishing}>
                    {publishing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    즉시 게시
                  </Button>
                </div>
                {publishError && <p className="text-sm text-destructive">{publishError}</p>}
                <p className="text-xs text-muted-foreground">설정 페이지에서 네이버 블로그를 연동해야 합니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SEO 분석 */}
      {seoAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">네이버 SEO 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <SeoScore analysis={seoAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* 자연화 분석 */}
      <NaturalizationPanel
        score={data.naturalizationScore}
        changes={data.naturalizationChanges}
      />

      {/* 생성된 이미지 */}
      {data.imageUrls && data.imageUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              생성된 이미지 ({data.imageUrls.length}장)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.imageUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group">
                  <img
                    src={url}
                    alt={`생성 이미지 ${i + 1}`}
                    className="w-full rounded-lg border transition-opacity group-hover:opacity-90"
                  />
                </a>
              ))}
            </div>
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
