'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { TagInput } from './tag-input';
import { STYLE_OPTIONS, LENGTH_OPTIONS } from '@/lib/prompts';
import type { StyleId, LengthId, GenerationMode } from '@/lib/types';
import { cn } from '@/lib/utils';

export function GenerateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [style, setStyle] = useState<StyleId>('casual');
  const [length, setLength] = useState<LengthId>('medium');
  const [mode, setMode] = useState<GenerationMode>('quick');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!topic.trim()) {
      setError('주제를 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keywords, style, length, mode, additionalInfo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '생성 요청 실패');
        setLoading(false);
        return;
      }

      router.push(`/result/${data.id}`);
    } catch {
      setError('서버 연결에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 주제 입력 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">주제</label>
        <Textarea
          placeholder="블로그 글의 주제를 입력하세요. 예: 서울 카페 추천, ChatGPT 활용법..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
        />
      </div>

      {/* 키워드 입력 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">키워드 (선택)</label>
        <TagInput tags={keywords} onChange={setKeywords} />
      </div>

      {/* 스타일 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">글쓰기 스타일</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STYLE_OPTIONS.map((opt) => (
            <Card
              key={opt.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                style === opt.id && 'border-primary ring-1 ring-primary',
              )}
              onClick={() => setStyle(opt.id)}
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
          ))}
        </div>
      </div>

      {/* 길이 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">글 길이</label>
        <div className="flex gap-2">
          {LENGTH_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={length === opt.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLength(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 모드 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">생성 모드</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'quick' ? 'default' : 'outline'}
            onClick={() => setMode('quick')}
            className="flex-1"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            빠른 생성
          </Button>
          <Button
            type="button"
            variant={mode === 'quality' ? 'default' : 'outline'}
            onClick={() => setMode('quality')}
            className="flex-1"
          >
            <Crown className="mr-1.5 h-4 w-4" />
            고품질 생성
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === 'quick' ? 'Claude 1회 호출로 빠르게 생성합니다.' : 'Claude 2회 호출 (초안 + 고도화)으로 품질을 높입니다.'}
        </p>
      </div>

      {/* 추가 정보 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">추가 정보 (선택)</label>
        <Textarea
          placeholder="포함할 내용, 참고 정보, 특별한 요청사항..."
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          rows={2}
        />
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* 생성 버튼 */}
      <Button onClick={handleSubmit} disabled={loading || !topic.trim()} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            블로그 글 생성
          </>
        )}
      </Button>
    </div>
  );
}
