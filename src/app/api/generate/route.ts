import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { query } from '@/lib/db';
import { runClaudeForBlog } from '@/lib/claude';
import { STYLE_PROMPTS, LENGTH_CONFIG, buildUserPrompt, buildFoodReviewPrompt, buildQualityReviewPrompt } from '@/lib/prompts';
import { analyzeSEO } from '@/lib/seo-analyzer';
import { parseResult } from '@/lib/seo-analyzer';
import { setProgress, getRunningCount } from '@/lib/generation-store';
import type { StyleId, LengthId, GenerationMode } from '@/lib/types';

const VALID_STYLES: StyleId[] = ['casual', 'informative', 'review', 'food_review', 'marketing', 'story'];
const VALID_LENGTHS: LengthId[] = ['short', 'medium', 'long'];
const VALID_MODES: GenerationMode[] = ['quick', 'quality'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, keywords = [], style = 'casual', length = 'medium', mode = 'quick', additionalInfo = '' } = body;

    // 검증
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });
    }
    if (!VALID_STYLES.includes(style)) {
      return NextResponse.json({ error: `유효하지 않은 스타일: ${style}` }, { status: 400 });
    }
    if (!VALID_LENGTHS.includes(length)) {
      return NextResponse.json({ error: `유효하지 않은 길이: ${length}` }, { status: 400 });
    }
    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: `유효하지 않은 모드: ${mode}` }, { status: 400 });
    }

    // 동시 생성 제한 (개인 사용: 1개)
    if (getRunningCount() >= 1) {
      return NextResponse.json({ error: '이미 생성 중인 글이 있습니다. 완료 후 다시 시도해주세요.' }, { status: 429 });
    }

    // DB에 레코드 삽입
    const id = randomUUID();
    await query(
      `INSERT INTO generations (id, topic, keywords, style, length, mode, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'running')`,
      [id, topic.trim(), keywords, style, length, mode],
    );

    // 인메모리 스토어에 등록
    setProgress(id, 'running', '글 생성을 시작합니다...');

    // 비동기 백그라운드 실행
    runGeneration(id, {
      topic: topic.trim(),
      keywords,
      style: style as StyleId,
      length: length as LengthId,
      mode: mode as GenerationMode,
      additionalInfo,
    }).catch(err => {
      console.error(`[Generate] Background error for ${id}:`, err);
    });

    return NextResponse.json({ id, status: 'running' }, { status: 202 });
  } catch (err) {
    console.error('[Generate] Error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function runGeneration(
  id: string,
  params: {
    topic: string;
    keywords: string[];
    style: StyleId;
    length: LengthId;
    mode: GenerationMode;
    additionalInfo: string;
  },
) {
  const startTime = Date.now();

  try {
    const systemPrompt = STYLE_PROMPTS[params.style];
    const userPrompt = params.style === 'food_review'
      ? buildFoodReviewPrompt(params)
      : buildUserPrompt(params);

    // 1단계: 초안 생성
    setProgress(id, 'running', params.mode === 'quality' ? '초안을 생성하고 있습니다... (1/2 단계)' : '글을 생성하고 있습니다...');

    const result1 = await runClaudeForBlog(systemPrompt, userPrompt, { timeout: 180000 });

    if (result1.exitCode !== 0 || !result1.output) {
      throw new Error(result1.stderr || 'Claude CLI 응답 없음');
    }

    let finalOutput = result1.output;
    let totalInputTokens = result1.usage.inputTokens;
    let totalOutputTokens = result1.usage.outputTokens;
    let totalCost = result1.usage.costUsd;

    // 2단계: Quality 모드 — 고도화
    if (params.mode === 'quality') {
      setProgress(id, 'running', '글을 고도화하고 있습니다... (2/2 단계)');
      const reviewPrompt = buildQualityReviewPrompt(result1.output);
      const result2 = await runClaudeForBlog(systemPrompt, reviewPrompt, { timeout: 180000 });

      if (result2.exitCode === 0 && result2.output) {
        finalOutput = result2.output;
        totalInputTokens += result2.usage.inputTokens;
        totalOutputTokens += result2.usage.outputTokens;
        totalCost += result2.usage.costUsd;
      }
    }

    // 결과 파싱
    const parsed = parseResult(finalOutput);
    const seo = analyzeSEO(finalOutput, params.keywords);
    const durationSec = Math.round((Date.now() - startTime) / 1000);

    // DB 업데이트
    await query(
      `UPDATE generations SET
        title = $2, content = $3, char_count = $4, read_time = $5,
        headings = $6, seo_score = $7, input_tokens = $8, output_tokens = $9,
        cost_usd = $10, duration_sec = $11, status = 'completed', completed_at = NOW()
      WHERE id = $1`,
      [id, parsed.title, finalOutput, parsed.charCount, parsed.readTime,
       parsed.headings, seo.score, totalInputTokens, totalOutputTokens,
       totalCost, durationSec],
    );

    setProgress(id, 'completed', '완료!');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    console.error(`[Generate] Failed ${id}:`, errorMsg);

    await query(
      `UPDATE generations SET status = 'failed', error = $2, duration_sec = $3, completed_at = NOW() WHERE id = $1`,
      [id, errorMsg, durationSec],
    ).catch(dbErr => console.error('[Generate] DB update error:', dbErr));

    setProgress(id, 'failed', '생성 실패', errorMsg);
  }
}
