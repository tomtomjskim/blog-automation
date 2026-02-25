'use client';

import { use } from 'react';
import { useGenerate } from '@/hooks/use-generate';
import { ResultView } from '@/components/result-view';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const state = useGenerate(id);
  const router = useRouter();

  if (state.status === 'running' || state.status === 'idle') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">블로그 글을 생성하고 있습니다</p>
            <p className="text-sm text-muted-foreground">{state.progress || '잠시만 기다려주세요...'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'failed') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <p className="font-medium">생성에 실패했습니다</p>
            <p className="text-sm text-muted-foreground">{state.error}</p>
          </div>
          <Button onClick={() => router.push('/')} variant="outline">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.data) {
    return <ResultView data={state.data} />;
  }

  return null;
}
