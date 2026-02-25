'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Trash2, FileText, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STYLE_OPTIONS } from '@/lib/prompts';

interface HistoryItem {
  id: string;
  topic: string;
  title: string | null;
  style: string;
  mode: string;
  charCount: number | null;
  readTime: number | null;
  seoScore: number | null;
  status: string;
  createdAt: string;
}

export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (styleFilter) params.set('style', styleFilter);

    try {
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      console.error('히스토리 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [page, search, styleFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    fetchHistory();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const getStyleLabel = (styleId: string) => {
    return STYLE_OPTIONS.find(s => s.id === styleId)?.name || styleId;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* 검색 + 필터 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="주제 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={styleFilter}
          onChange={(e) => { setStyleFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">전체 스타일</option>
          {STYLE_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
      </form>

      {/* 목록 */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {search || styleFilter ? '검색 결과가 없습니다.' : '아직 생성된 글이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center gap-4 p-4">
                <Link href={`/result/${item.id}`} className="flex-1 space-y-1">
                  <div className="font-medium">{item.title || item.topic}</div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Badge variant="secondary" className="text-xs">{getStyleLabel(item.style)}</Badge>
                    {item.status === 'failed' && <Badge variant="destructive" className="text-xs">실패</Badge>}
                    {item.charCount && (
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <FileText className="h-3 w-3" /> {item.charCount.toLocaleString()}자
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {formatDate(item.createdAt)}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            이전
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
