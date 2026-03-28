import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { suggestRelatedKeywords } from '@/lib/keyword-research';
import { randomUUID } from 'crypto';
import { withApiHandler, apiOk, ApiError } from '@/lib/api';

export const GET = withApiHandler(async () => {
  const result = await query<{
    id: string; topic: string; primary_keyword: string;
    secondary_keywords: string[]; long_tail_keywords: string[];
    user_notes: string | null; manual_volume: number | null;
    manual_difficulty: number | null; created_at: string;
  }>(
    `SELECT * FROM keyword_research ORDER BY created_at DESC LIMIT 50`,
  );
  const items = result.map(r => ({
    id: r.id,
    topic: r.topic,
    primaryKeyword: r.primary_keyword,
    secondaryKeywords: r.secondary_keywords,
    longTailKeywords: r.long_tail_keywords,
    userNotes: r.user_notes,
    manualVolume: r.manual_volume,
    manualDifficulty: r.manual_difficulty,
    createdAt: r.created_at,
  }));
  return apiOk(items);
}, { tag: 'Keywords' });

export const POST = withApiHandler(async (req: NextRequest) => {
  const { topic, primaryKeywords = [] } = await req.json();

  if (!topic) {
    throw new ApiError('주제를 입력해주세요.', 400);
  }

  // AI 키워드 추천
  const suggestions = await suggestRelatedKeywords(topic, primaryKeywords);

  // DB 저장
  const id = randomUUID();
  const primaryKw = suggestions.primary[0] || primaryKeywords[0] || topic;
  await query(
    `INSERT INTO keyword_research (id, topic, primary_keyword, secondary_keywords, long_tail_keywords)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, topic, primaryKw, suggestions.secondary, suggestions.longTail],
  );

  return apiOk({
    id,
    topic,
    primary: suggestions.primary,
    secondary: suggestions.secondary,
    longTail: suggestions.longTail,
    inputTokens: suggestions.inputTokens,
    outputTokens: suggestions.outputTokens,
    costUsd: suggestions.costUsd,
  }, 201);
}, { tag: 'Keywords' });
