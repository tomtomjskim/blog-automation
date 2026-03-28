import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { query, queryOne } from '@/lib/db';
import { runClaudeForBlog, runClaude, runClaudeWithImages } from '@/lib/claude';
import { STYLE_PROMPTS, buildUserPrompt, buildFoodReviewPrompt, buildQualityReviewPrompt, buildImageAnalysisPrompt, buildImageContextBlock } from '@/lib/prompts';
import { analyzeNaverSEO, parseResult } from '@/lib/seo-analyzer';
import { buildPersonaSystemPrompt } from '@/lib/personas';
import { naturalizeContent } from '@/lib/naturalization';
import { setProgress, getRunningCount } from '@/lib/generation-store';
import { isKlingConfigured, generateImage, buildImagePromptInstruction, parseImagePrompts } from '@/lib/kling';
import path from 'path';
import { stat as fsStat } from 'fs/promises';
import type { StyleId, LengthId, GenerationMode, ToneId, PersonaId } from '@/lib/types';

const VALID_STYLES: StyleId[] = ['casual', 'informative', 'review', 'food_review', 'marketing', 'story'];
const VALID_LENGTHS: LengthId[] = ['short', 'medium', 'long', 'standard', 'deep', 'premium'];
const VALID_MODES: GenerationMode[] = ['quick', 'quality'];
const VALID_TONES: ToneId[] = ['haeyoche', 'banmal'];
const VALID_PERSONAS: PersonaId[] = ['beauty', 'food', 'tech', 'travel', 'selfdev', 'parenting', 'finance', 'interior', 'custom'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic, keywords = [], style = 'casual', length = 'standard',
      mode = 'quick', tone = 'haeyoche', persona = null,
      naturalize = false, additionalInfo = '',
      styleProfileId = null, generateImages = false,
      imageIds = [],
      includeFaq = false, lsiKeywords = [], titleStyle = 'auto',
    } = body;

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
    if (tone && !VALID_TONES.includes(tone)) {
      return NextResponse.json({ error: `유효하지 않은 톤: ${tone}` }, { status: 400 });
    }
    if (persona && !VALID_PERSONAS.includes(persona)) {
      return NextResponse.json({ error: `유효하지 않은 페르소나: ${persona}` }, { status: 400 });
    }

    // 동시 생성 제한
    if (getRunningCount() >= 1) {
      return NextResponse.json({ error: '이미 생성 중인 글이 있습니다. 완료 후 다시 시도해주세요.' }, { status: 429 });
    }

    // DB에 레코드 삽입
    const id = randomUUID();
    await query(
      `INSERT INTO generations (id, topic, keywords, style, length, mode, tone, persona, style_profile_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'running')`,
      [id, topic.trim(), keywords, style, length, mode, tone || null, persona || null, styleProfileId],
    );

    setProgress(id, 'running', '글 생성을 시작합니다...');

    // 비동기 백그라운드 실행
    runGeneration(id, {
      topic: topic.trim(),
      keywords,
      style: style as StyleId,
      length: length as LengthId,
      mode: mode as GenerationMode,
      tone: (tone || 'haeyoche') as ToneId,
      persona: persona as PersonaId | null,
      naturalize: !!naturalize,
      additionalInfo,
      styleProfileId,
      generateImages: generateImages && isKlingConfigured(),
      imageIds: Array.isArray(imageIds) ? imageIds : [],
      includeFaq: !!includeFaq,
      lsiKeywords: Array.isArray(lsiKeywords) ? lsiKeywords : [],
      titleStyle: titleStyle || 'auto',
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
    tone: ToneId;
    persona: PersonaId | null;
    naturalize: boolean;
    additionalInfo: string;
    styleProfileId: string | null;
    generateImages: boolean;
    imageIds: string[];
    includeFaq: boolean;
    lsiKeywords: string[];
    titleStyle: 'number' | 'question' | 'tip' | 'auto';
  },
) {
  const startTime = Date.now();

  try {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    // 시스템 프롬프트: 페르소나 기반 통합 빌더 사용
    let systemPrompt = buildPersonaSystemPrompt(params.persona, params.style, params.tone);

    if (params.styleProfileId) {
      const profile = await queryOne<{ profile: string }>(
        'SELECT profile FROM style_profiles WHERE id = $1',
        [params.styleProfileId],
      );
      if (profile?.profile) {
        systemPrompt += `\n\n## 글쓴이 고유 스타일 (반드시 반영)\n${profile.profile}`;
      }
    }

    // 0단계: 첨부 이미지 분석
    let imageContext = '';
    const attachedImageUrls: string[] = [];
    const hasImages = params.imageIds.length > 0;

    if (hasImages) {
      setProgress(id, 'running', '첨부 이미지를 분석하고 있습니다...');

      const UPLOAD_DIR = '/app/uploads/images';
      const imagePaths: string[] = [];

      for (const imgId of params.imageIds) {
        const safeId = imgId.replace(/[^a-f0-9-]/g, '');
        for (const ext of ['.jpg', '.png', '.webp']) {
          const candidate = path.join(UPLOAD_DIR, `${safeId}${ext}`);
          try {
            await fsStat(candidate);
            imagePaths.push(candidate);
            attachedImageUrls.push(`/api/images/${safeId}${ext}`);
            break;
          } catch {
            // 다음 확장자 시도
          }
        }
      }

      if (imagePaths.length > 0) {
        try {
          const analysisPrompt = buildImageAnalysisPrompt(params.topic, params.style);
          const analysisResult = await runClaudeWithImages(analysisPrompt, imagePaths, { timeout: 120000 });

          if (analysisResult.exitCode === 0 && analysisResult.output) {
            totalInputTokens += analysisResult.usage.inputTokens;
            totalOutputTokens += analysisResult.usage.outputTokens;
            totalCost += analysisResult.usage.costUsd;

            let jsonStr = analysisResult.output.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1].trim();
            const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrMatch) jsonStr = arrMatch[0];

            try {
              const analyses = JSON.parse(jsonStr);
              if (Array.isArray(analyses)) {
                imageContext = buildImageContextBlock(analyses, attachedImageUrls);
              }
            } catch (parseErr) {
              console.error('[Generate] Image analysis JSON parse failed:', parseErr);
              imageContext = `\n## 첨부 이미지\n`;
              attachedImageUrls.forEach((url, i) => {
                imageContext += `- ![첨부 이미지 ${i + 1}](${url})\n`;
              });
            }
          }
        } catch (imgErr) {
          console.error('[Generate] Image analysis failed:', imgErr);
          imageContext = `\n## 첨부 이미지\n`;
          attachedImageUrls.forEach((url, i) => {
            imageContext += `- ![첨부 이미지 ${i + 1}](${url})\n`;
          });
        }
      }
    }

    const promptParams = {
      ...params,
      imageContext: imageContext || undefined,
      includeFaq: params.includeFaq || undefined,
      lsiKeywords: params.lsiKeywords.length > 0 ? params.lsiKeywords : undefined,
      titleStyle: params.titleStyle !== 'auto' ? params.titleStyle : undefined,
    };
    const userPrompt = params.style === 'food_review'
      ? buildFoodReviewPrompt(promptParams)
      : buildUserPrompt(promptParams);

    // 1단계: 초안 생성
    const hasNaturalize = params.naturalize;
    const totalSteps = (hasImages ? 1 : 0) + (params.mode === 'quality' ? 2 : 1) + (params.generateImages ? 1 : 0) + (hasNaturalize ? 1 : 0);
    let step = 1;
    setProgress(id, 'running', `글을 생성하고 있습니다... (${step}/${totalSteps} 단계)`);

    const result1 = await runClaudeForBlog(systemPrompt, userPrompt, { timeout: 180000 });

    if (result1.exitCode !== 0 || !result1.output) {
      throw new Error(result1.stderr || 'Claude CLI 응답 없음');
    }

    let finalOutput = result1.output;
    totalInputTokens += result1.usage.inputTokens;
    totalOutputTokens += result1.usage.outputTokens;
    totalCost += result1.usage.costUsd;

    // 2단계: Quality 모드 — 고도화
    if (params.mode === 'quality') {
      step++;
      setProgress(id, 'running', `글을 고도화하고 있습니다... (${step}/${totalSteps} 단계)`);
      const reviewPrompt = buildQualityReviewPrompt(result1.output);
      const result2 = await runClaudeForBlog(systemPrompt, reviewPrompt, { timeout: 180000 });

      if (result2.exitCode === 0 && result2.output) {
        finalOutput = result2.output;
        totalInputTokens += result2.usage.inputTokens;
        totalOutputTokens += result2.usage.outputTokens;
        totalCost += result2.usage.costUsd;
      }
    }

    // 자연화 단계
    let naturalizationScore: number | null = null;
    let naturalizationChanges: unknown = null;

    if (hasNaturalize) {
      step++;
      setProgress(id, 'running', `문체를 자연화하고 있습니다... (${step}/${totalSteps} 단계)`);
      try {
        const natResult = await naturalizeContent(finalOutput, params.persona);
        finalOutput = natResult.naturalizedContent;
        naturalizationScore = natResult.score;
        naturalizationChanges = natResult.changes;
        totalInputTokens += natResult.inputTokens;
        totalOutputTokens += natResult.outputTokens;
        totalCost += natResult.costUsd;
      } catch (natErr) {
        console.error('[Generate] Naturalization failed:', natErr);
        // 자연화 실패해도 글 생성은 완료 처리
      }
    }

    // 이미지 URL 수집
    let imageUrls: string[] = [...attachedImageUrls];
    if (params.generateImages) {
      step++;
      setProgress(id, 'running', `이미지를 생성하고 있습니다... (${step}/${totalSteps} 단계)`);

      try {
        const imgPromptReq = `다음 블로그 글의 핵심 주제를 시각적으로 표현하는 영문 이미지 프롬프트를 2개 생성해주세요.\n\n블로그 글:\n${finalOutput.slice(0, 2000)}\n${buildImagePromptInstruction(2)}`;
        const imgPromptResult = await runClaude(imgPromptReq, { timeout: 60000 });

        if (imgPromptResult.exitCode === 0 && imgPromptResult.output) {
          totalInputTokens += imgPromptResult.usage.inputTokens;
          totalOutputTokens += imgPromptResult.usage.outputTokens;
          totalCost += imgPromptResult.usage.costUsd;

          const prompts = parseImagePrompts(imgPromptResult.output);
          for (const prompt of prompts.slice(0, 2)) {
            try {
              const imgResult = await generateImage({ prompt, aspectRatio: '16:9', count: 1 });
              imageUrls.push(...imgResult.imageUrls);
            } catch (imgErr) {
              console.error(`[Generate] Image generation failed:`, imgErr);
            }
          }
        }
      } catch (imgErr) {
        console.error(`[Generate] Image prompt generation failed:`, imgErr);
      }
    }

    // 결과 파싱
    const parsed = parseResult(finalOutput);
    const seo = analyzeNaverSEO(finalOutput, params.keywords);
    const durationSec = Math.round((Date.now() - startTime) / 1000);

    // DB 업데이트
    await query(
      `UPDATE generations SET
        title = $2, content = $3, char_count = $4, read_time = $5,
        headings = $6, seo_score = $7, input_tokens = $8, output_tokens = $9,
        cost_usd = $10, duration_sec = $11, image_urls = $12,
        naturalization_score = $13, naturalization_changes = $14,
        status = 'completed', completed_at = NOW()
      WHERE id = $1`,
      [id, parsed.title, finalOutput, parsed.charCount, parsed.readTime,
       parsed.headings, seo.score, totalInputTokens, totalOutputTokens,
       totalCost, durationSec, imageUrls,
       naturalizationScore, naturalizationChanges ? JSON.stringify(naturalizationChanges) : null],
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
