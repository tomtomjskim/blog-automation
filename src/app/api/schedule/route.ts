import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';
import { withApiHandler, apiOk, ApiError } from '@/lib/api';

export const GET = withApiHandler(async () => {
  const result = await query<{
    id: string; topic: string; keywords: string[]; style: string; length: string;
    persona: string | null; tone: string | null; scheduled_at: string;
    generation_id: string | null; status: string; auto_publish: boolean; created_at: string;
  }>(
    `SELECT * FROM scheduled_posts ORDER BY scheduled_at ASC`,
  );
  const items = result.map(r => ({
    id: r.id,
    topic: r.topic,
    keywords: r.keywords,
    style: r.style,
    length: r.length,
    persona: r.persona,
    tone: r.tone,
    scheduledAt: r.scheduled_at,
    generationId: r.generation_id,
    status: r.status,
    autoPublish: r.auto_publish,
    createdAt: r.created_at,
  }));
  return apiOk(items);
}, { tag: 'Schedule' });

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { topic, keywords = [], style = 'casual', length = 'standard', persona, tone, scheduledAt, autoPublish = false } = body;

  if (!topic || !scheduledAt) {
    throw new ApiError('주제와 예약 시간이 필요합니다.', 400);
  }

  const id = randomUUID();
  await query(
    `INSERT INTO scheduled_posts (id, topic, keywords, style, length, persona, tone, scheduled_at, auto_publish)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, topic, keywords, style, length, persona || null, tone || null, scheduledAt, autoPublish],
  );

  return apiOk({ id, status: 'pending' }, 201);
}, { tag: 'Schedule' });
