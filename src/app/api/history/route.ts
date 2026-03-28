import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withApiHandler, apiOk, ApiError } from '@/lib/api';

interface HistoryRow {
  id: string;
  topic: string;
  keywords: string[];
  style: string;
  length: string;
  mode: string;
  tone: string | null;
  persona: string | null;
  title: string | null;
  char_count: number | null;
  read_time: number | null;
  seo_score: number | null;
  status: string;
  cost_usd: string;
  duration_sec: number;
  created_at: string;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const search = searchParams.get('search') || '';
  const style = searchParams.get('style') || '';
  const offset = (page - 1) * limit;

  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`topic ILIKE $${paramIdx}`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (style) {
    conditions.push(`style = $${paramIdx}`);
    params.push(style);
    paramIdx++;
  }

  const where = conditions.join(' AND ');

  const rows = await query<HistoryRow>(
    `SELECT id, topic, keywords, style, length, mode, tone, persona, title, char_count, read_time,
            seo_score, status, cost_usd, duration_sec, created_at
     FROM generations
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset],
  );

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM generations WHERE ${where}`,
    params,
  );

  const total = parseInt(countResult?.count || '0');

  return apiOk({
    items: rows.map(r => ({
      ...r,
      charCount: r.char_count,
      readTime: r.read_time,
      seoScore: r.seo_score,
      costUsd: parseFloat(r.cost_usd || '0'),
      durationSec: r.duration_sec,
      createdAt: r.created_at,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}, { tag: 'History' });

export const DELETE = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new ApiError('id 파라미터가 필요합니다.', 400);
  }

  await query(
    `UPDATE generations SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );

  return apiOk({ success: true });
}, { tag: 'History' });

