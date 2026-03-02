'use client';

import { useState, useEffect } from 'react';
import { Settings, TestTube, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [blogId, setBlogId] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [klingConfigured, setKlingConfigured] = useState(false);
  const [naverConfigured, setNaverConfigured] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setKlingConfigured(data.kling?.configured || false);
        setNaverConfigured(data.naver?.configured || false);
        if (data.naver?.blogId) setBlogId(data.naver.blogId);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!blogId.trim() || !apiPassword.trim()) {
      setMessage('블로그 ID와 API 비밀번호를 모두 입력해주세요.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naverBlogId: blogId, naverApiPassword: apiPassword }),
      });
      if (res.ok) {
        setMessage('저장되었습니다.');
        setNaverConfigured(true);
      } else {
        const data = await res.json();
        setMessage(data.error || '저장 실패');
      }
    } catch {
      setMessage('서버 연결 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/naver/categories');
      setTestResult(res.ok ? 'success' : 'fail');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-xl font-bold">설정</h1>
      </div>

      {/* 네이버 블로그 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            네이버 블로그 연동
            <Badge variant={naverConfigured ? 'default' : 'secondary'}>
              {naverConfigured ? '연결됨' : '미설정'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">블로그 ID</label>
            <Input
              value={blogId}
              onChange={(e) => setBlogId(e.target.value)}
              placeholder="네이버 블로그 ID"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API 비밀번호</label>
            <Input
              type="password"
              value={apiPassword}
              onChange={(e) => setApiPassword(e.target.value)}
              placeholder="네이버 블로그 관리 > 글쓰기 API에서 발급"
            />
            <p className="text-xs text-muted-foreground">
              네이버 블로그 관리 → 글쓰기 API 설정에서 발급받은 비밀번호
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              저장
            </Button>
            <Button onClick={handleTest} variant="outline" disabled={testing || !naverConfigured}>
              {testing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-1.5 h-4 w-4" />
              )}
              연결 테스트
            </Button>
            {testResult === 'success' && <Badge className="bg-green-500"><Check className="mr-1 h-3 w-3" />성공</Badge>}
            {testResult === 'fail' && <Badge variant="destructive"><X className="mr-1 h-3 w-3" />실패</Badge>}
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      {/* Kling AI 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Kling AI 이미지 생성
            <Badge variant={klingConfigured ? 'default' : 'secondary'}>
              {klingConfigured ? '활성화' : '미설정'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {klingConfigured
              ? 'Kling AI API가 설정되어 있습니다. 이미지 자동 생성을 사용할 수 있습니다.'
              : 'docker-compose.yml의 KLING_ACCESS_KEY, KLING_SECRET_KEY 환경변수를 설정하세요.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
