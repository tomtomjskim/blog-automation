'use client';

import { useState } from 'react';
import { Copy, Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { convertToNaverHtml } from '@/lib/markdown-to-naver';

interface NaverPreviewProps {
  markdown: string;
}

export function NaverPreview({ markdown }: NaverPreviewProps) {
  const [copied, setCopied] = useState(false);
  const naverHtml = convertToNaverHtml(markdown);

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(naverHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            네이버 프리뷰
          </CardTitle>
          <Button onClick={handleCopyHtml} variant="outline" size="sm">
            {copied ? (
              <><Check className="mr-1.5 h-3 w-3" />복사됨</>
            ) : (
              <><Copy className="mr-1.5 h-3 w-3" />HTML 복사</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="rounded-lg border bg-white p-6 dark:bg-gray-50"
          dangerouslySetInnerHTML={{ __html: naverHtml }}
        />
      </CardContent>
    </Card>
  );
}
