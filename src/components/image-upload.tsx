'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadedImage } from '@/lib/types';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    setError('');

    const remaining = MAX_FILES - images.length;
    if (remaining <= 0) {
      setError(`최대 ${MAX_FILES}장까지 업로드 가능합니다.`);
      return;
    }

    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`허용되지 않는 형식: ${file.name}. JPEG, PNG, WebP만 가능합니다.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`파일이 너무 큽니다: ${file.name}. 최대 5MB입니다.`);
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      toUpload.forEach(f => formData.append('images', f));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '업로드 실패');
        return;
      }

      onChange([...images, ...data]);
    } catch {
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  }, [images, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) uploadFiles(files);
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFiles(files);
    e.target.value = '';
  }, [uploadFiles]);

  const removeImage = useCallback((id: string) => {
    onChange(images.filter(img => img.id !== id));
  }, [images, onChange]);

  return (
    <div className="space-y-3">
      {/* 드래그앤드롭 영역 */}
      {images.length < MAX_FILES && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {uploading ? '업로드 중...' : '이미지를 드래그하거나 클릭하여 선택'}
            </p>
            <p className="text-xs text-muted-foreground/70">
              JPEG, PNG, WebP / 최대 5MB / {images.length}/{MAX_FILES}장
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* 썸네일 미리보기 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border">
              <img
                src={img.url}
                alt={img.originalName}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
                {img.originalName}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
