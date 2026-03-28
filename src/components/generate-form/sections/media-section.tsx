'use client';

import { ImageUpload } from '@/components/image-upload';
import type { UploadedImage } from '@/lib/types';

interface MediaSectionProps {
  uploadedImages: UploadedImage[];
  setUploadedImages: (v: UploadedImage[]) => void;
}

export function MediaSection({ uploadedImages, setUploadedImages }: MediaSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">이미지 첨부 (선택)</label>
      <ImageUpload images={uploadedImages} onChange={setUploadedImages} />
      <p className="text-xs text-muted-foreground">
        첨부된 이미지를 AI가 분석하여 글의 적절한 위치에 삽입합니다.
      </p>
    </div>
  );
}
