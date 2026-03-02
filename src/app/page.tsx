import { Suspense } from 'react';
import { GenerateForm } from '@/components/generate-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">AI 블로그 글 생성</CardTitle>
        <CardDescription>주제를 입력하면 Claude가 네이버 블로그에 최적화된 글을 작성합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="py-8 text-center text-muted-foreground">로딩 중...</div>}>
          <GenerateForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
