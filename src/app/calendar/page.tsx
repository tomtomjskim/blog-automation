'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ScheduledPost {
  id: string;
  topic: string;
  style: string;
  scheduledAt: string;
  status: string;
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) setPosts(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleSubmit = async () => {
    if (!topic.trim() || !scheduledAt) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, scheduledAt: new Date(scheduledAt).toISOString(), style: 'casual', length: 'standard' }),
      });
      if (res.ok) {
        setTopic('');
        setScheduledAt('');
        setShowForm(false);
        loadPosts();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  // 현재 월 기준 캘린더 그리드 생성
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => p.scheduledAt.startsWith(dateStr));
  };

  // 최적 시간대 하이라이트
  const isOptimalHour = (hour: number) => (hour >= 10 && hour <= 11) || (hour >= 19 && hour <= 21);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-xl font-bold">콘텐츠 캘린더</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          새 예약
        </Button>
      </div>

      {/* 새 예약 폼 */}
      {showForm && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <Input placeholder="주제" value={topic} onChange={e => setTopic(e.target.value)} />
            <div className="space-y-1">
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                최적 시간: 오전 10-11시, 저녁 7-9시
              </p>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !topic.trim() || !scheduledAt} size="sm">
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              예약 등록
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 월간 그리드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {year}년 {month + 1}월
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`min-h-[60px] rounded-md border p-1 text-xs ${day === now.getDate() ? 'border-primary bg-primary/5' : 'border-transparent'} ${!day ? 'bg-transparent' : 'bg-muted/30'}`}
                >
                  {day && (
                    <>
                      <div className="font-medium">{day}</div>
                      {getPostsForDay(day).map(p => (
                        <div key={p.id} className={`mt-0.5 truncate rounded px-1 py-0.5 text-[10px] ${statusColor[p.status] || ''}`}>
                          {p.topic.slice(0, 8)}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 예약 목록 사이드바 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">예약 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">예약된 글이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {posts.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <div className="text-sm font-medium">{p.topic}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.scheduledAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <Badge variant="secondary">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
