'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface KeywordResult {
  id: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  createdAt: string;
}

export default function KeywordsPage() {
  const router = useRouter();
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadResults = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords');
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
    setFetching(false);
  }, []);

  useEffect(() => { loadResults(); }, [loadResults]);

  const handleResearch = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      if (res.ok) {
        setTopic('');
        loadResults();
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleUseKeywords = (result: KeywordResult) => {
    const params = new URLSearchParams({
      topic: result.topic,
      keywords: [result.primaryKeyword, ...result.secondaryKeywords.slice(0, 2)].join(','),
    });
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5" />
        <h1 className="text-xl font-bold">키워드 리서치</h1>
      </div>

      {/* 리서치 입력 */}
      <Card>
        <CardContent className="flex gap-2 pt-4">
          <Input
            placeholder="블로그 주제를 입력하세요"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleResearch()}
          />
          <Button onClick={handleResearch} disabled={loading || !topic.trim()}>
            {loading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            AI 추천
          </Button>
        </CardContent>
      </Card>

      {/* 결과 목록 */}
      {fetching ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : results.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">아직 키워드 리서치 결과가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {results.map(result => (
            <Card key={result.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{result.topic}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleUseKeywords(result)}>
                    <ArrowRight className="mr-1.5 h-3 w-3" />
                    글 생성
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">주키워드</span>
                    <div className="mt-1"><Badge>{result.primaryKeyword}</Badge></div>
                  </div>
                  {result.secondaryKeywords.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">보조키워드</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {result.secondaryKeywords.map(kw => (
                          <Badge key={kw} variant="secondary">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.longTailKeywords.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">롱테일</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {result.longTailKeywords.map(kw => (
                          <Badge key={kw} variant="outline">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
