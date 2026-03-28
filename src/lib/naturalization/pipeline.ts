import { runClaudeForBlog } from '@/lib/claude';
import { buildNaturalizationPrompt } from '@/lib/prompts';
import type { NaturalizationChange } from '@/lib/types';
import { replaceAIVocab } from './stages/vocab-replacer';
import { mixSentenceLengths } from './stages/sentence-mixer';
import { insertExperiencePhrases } from './stages/experience-inserter';
import { calculateNaturalizationScore } from './scorer';

/** 4단계 자연화 파이프라인 (규칙 기반) */
function ruleBasedNaturalize(content: string): { text: string; changes: NaturalizationChange[] } {
  const allChanges: NaturalizationChange[] = [];

  // A: AI 어휘 치환
  const vocabResult = replaceAIVocab(content);
  allChanges.push(...vocabResult.changes);

  // B: 문장 길이 변동
  const sentenceResult = mixSentenceLengths(vocabResult.text);
  allChanges.push(...sentenceResult.changes);

  // C: 경험 표현 삽입
  const expResult = insertExperiencePhrases(sentenceResult.text);
  allChanges.push(...expResult.changes);

  return { text: expResult.text, changes: allChanges };
}

/** 전체 자연화 파이프라인 (규칙 기반 + Claude 최종 처리) */
export async function naturalizeContent(content: string): Promise<{
  naturalizedContent: string;
  score: number;
  changes: NaturalizationChange[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}> {
  // 1단계: 규칙 기반 자연화
  const { text: ruleBasedText, changes } = ruleBasedNaturalize(content);

  // 2단계: Claude를 이용한 최종 자연화
  const naturalizationPrompt = buildNaturalizationPrompt(ruleBasedText);
  const result = await runClaudeForBlog(
    '당신은 텍스트 자연화 전문가입니다. AI가 작성한 텍스트를 인간이 쓴 것처럼 자연스럽게 수정합니다.',
    naturalizationPrompt,
    { timeout: 120000 },
  );

  let finalText = ruleBasedText;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  if (result.exitCode === 0 && result.output) {
    finalText = result.output;
    inputTokens = result.usage.inputTokens;
    outputTokens = result.usage.outputTokens;
    costUsd = result.usage.costUsd;
  }

  const score = calculateNaturalizationScore(content, finalText);

  return {
    naturalizedContent: finalText,
    score,
    changes,
    inputTokens,
    outputTokens,
    costUsd,
  };
}
