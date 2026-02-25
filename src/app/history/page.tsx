import { HistoryList } from '@/components/history-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HistoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">생성 히스토리</CardTitle>
      </CardHeader>
      <CardContent>
        <HistoryList />
      </CardContent>
    </Card>
  );
}
