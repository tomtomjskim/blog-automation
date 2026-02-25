import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { UploadedImage } from '@/lib/types';

const UPLOAD_DIR = '/app/uploads/images';
const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: '이미지를 선택해주세요.' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `최대 ${MAX_FILES}장까지 업로드 가능합니다.` }, { status: 400 });
    }

    // 디렉토리 보장
    await mkdir(UPLOAD_DIR, { recursive: true });

    const results: UploadedImage[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `허용되지 않는 형식: ${file.type}. JPEG, PNG, WebP만 가능합니다.` },
          { status: 400 },
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `파일이 너무 큽니다: ${file.name}. 최대 5MB입니다.` },
          { status: 400 },
        );
      }

      const ext = file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : '.webp';
      const id = randomUUID();
      const filename = `${id}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      results.push({
        id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/api/images/${filename}`,
      });
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('[Upload] Error:', err);
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 });
  }
}
