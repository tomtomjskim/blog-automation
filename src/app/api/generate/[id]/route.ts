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
  tone: string | null;
  persona: string | null;
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
  image_urls: string[] | null;
  style_profile_id: string | null;
  naturalization_score: number | null;
  naturalization_changes: unknown;
  naver_post_id: string | null;
  naver_post_url: string | null;
  published_at: string | null;
  publish_status: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 인메모리 스토어에서 진행 상태 확인
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
    tone: (row.tone as GenerationRecord['tone']) || null,
    persona: (row.persona as GenerationRecord['persona']) || null,
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
    imageUrls: row.image_urls || [],
    styleProfileId: row.style_profile_id,
    naturalizationScore: row.naturalization_score,
    naturalizationChanges: Array.isArray(row.naturalization_changes) ? row.naturalization_changes : null,
    naverPostId: row.naver_post_id,
    naverPostUrl: row.naver_post_url,
    publishedAt: row.published_at,
    publishStatus: (row.publish_status as GenerationRecord['publishStatus']) || 'none',
  };

  return NextResponse.json(record);
}
