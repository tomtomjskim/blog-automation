import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getProgress } from '@/lib/generation-store';
import type { GenerationRecord } from '@/lib/types';

interface DbRow {
  id: string;
  topic: string;
  keywords: string[];
  style: string;
  length: string;
  mode: string;
  title: string | null;
  content: string | null;
  char_count: number | null;
  read_time: number | null;
  headings: string[] | null;
  seo_score: number | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: string;
  duration_sec: number;
  status: string;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 인메모리 스토어에서 진행 상태 확인 (running일 때 빠른 응답)
  const progress = getProgress(id);
  if (progress && progress.status === 'running') {
    return NextResponse.json({
      id,
      status: 'running',
      progress: progress.progress,
    });
  }

  // DB에서 조회
  const row = await queryOne<DbRow>(
    `SELECT * FROM generations WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );

  if (!row) {
    return NextResponse.json({ error: '생성 결과를 찾을 수 없습니다.' }, { status: 404 });
  }

  const record: GenerationRecord = {
    id: row.id,
    topic: row.topic,
    keywords: row.keywords,
    style: row.style as GenerationRecord['style'],
    length: row.length as GenerationRecord['length'],
    mode: row.mode as GenerationRecord['mode'],
    title: row.title,
    content: row.content,
    charCount: row.char_count,
    readTime: row.read_time,
    headings: row.headings,
    seoScore: row.seo_score,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    costUsd: parseFloat(row.cost_usd),
    durationSec: row.duration_sec,
    status: row.status as GenerationRecord['status'],
    error: row.error,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };

  return NextResponse.json(record);
}
