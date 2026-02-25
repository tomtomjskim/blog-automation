'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { StyleProfile } from '@/lib/types';

export default function StylesPage() {
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 폼
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [samplesText, setSamplesText] = useState('');
  const [error, setError] = useState('');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/style-profile');
      setProfiles(await res.json());
    } catch {
      console.error('프로필 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleCreate = async () => {
    if (!name.trim()) { setError('프로필 이름을 입력해주세요.'); return; }
    if (!samplesText.trim()) { setError('분석할 글 샘플을 입력해주세요.'); return; }

    // 구분자로 샘플 분리 (---  또는 === 또는 빈줄 3개)
    const samples = samplesText
      .split(/(?:\n-{3,}\n|\n={3,}\n|\n{3,})/)
      .map(s => s.trim())
      .filter(s => s.length > 50);

    if (samples.length === 0) {
      setError('최소 50자 이상의 샘플이 1개 이상 필요합니다.');
      return;
    }

    setError('');
    setCreating(true);

    try {
      const res = await fetch('/api/style-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), samples }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '생성 실패');
        setCreating(false);
        return;
      }

      setName('');
      setDescription('');
      setSamplesText('');
      setShowForm(false);
      fetchProfiles();
    } catch {
      setError('서버 연결 실패');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 프로필을 삭제하시겠습니까?')) return;
    await fetch(`/api/style-profile?id=${id}`, { method: 'DELETE' });
    fetchProfiles();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">내 스타일 프로필</CardTitle>
              <CardDescription>기존 블로그 글의 문체를 학습하여 비슷한 스타일로 새 글을 생성합니다.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              {showForm ? '취소' : '새 프로필'}
            </Button>
          </div>
        </CardHeader>

        {/* 새 프로필 생성 폼 */}
        {showForm && (
          <CardContent className="border-t pt-6">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">프로필 이름</label>
                  <Input
                    placeholder="예: 내 일상 블로그 스타일"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">설명 (선택)</label>
                  <Input
                    placeholder="예: 네이버 블로그에 쓰는 캐주얼한 톤"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">글 샘플 (1~5개)</label>
                <Textarea
                  placeholder={`기존에 작성한 블로그 글을 붙여넣으세요.\n여러 글을 입력하려면 --- 로 구분합니다.\n\n예시:\n첫 번째 글 내용...\n---\n두 번째 글 내용...`}
                  value={samplesText}
                  onChange={(e) => setSamplesText(e.target.value)}
                  rows={12}
                />
                <p className="text-xs text-muted-foreground">
                  글 사이를 --- (대시 3개)로 구분하세요. 많을수록 분석이 정확합니다 (최대 5개).
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claude가 스타일을 분석하고 있습니다... (약 20초)
                  </>
                ) : (
                  '스타일 분석 시작'
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 프로필 목록 */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
      ) : profiles.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>아직 스타일 프로필이 없습니다.</p>
            <p className="text-sm">기존 글을 분석하여 나만의 스타일 프로필을 만들어보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.sampleCount}개 샘플 학습
                      </span>
                    </div>
                    {p.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{p.description}</p>
                    )}

                    {/* 프로필 내용 토글 */}
                    <button
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expandedId === p.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {expandedId === p.id ? '접기' : '프로필 내용 보기'}
                    </button>
                    {expandedId === p.id && (
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                        {p.profile}
                      </pre>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
