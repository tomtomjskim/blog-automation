import { GenerateForm } from '@/components/generate-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">AI 블로그 글 생성</CardTitle>
        <CardDescription>주제를 입력하면 Claude가 네이버 블로그 글을 작성합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <GenerateForm />
      </CardContent>
    </Card>
  );
}
