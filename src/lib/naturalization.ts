import { runClaudeForBlog } from './claude';
import { buildNaturalizationPrompt } from './prompts';
import type { NaturalizationChange } from './types';

/** AI 특유 어휘 패턴 → 구어체 치환 사전 */
const VOCAB_REPLACEMENTS: Array<[RegExp, string[]]> = [
  [/이로써/g, ['그래서', '덕분에', '']],
  [/결론적으로/g, ['정리하면', '한마디로', '']],
  [/매우 중요합니다/g, ['꽤 중요하더라고요', '이게 핵심이에요', '진짜 중요해요']],
  [/다양한 측면에서/g, ['여러모로', '이것저것 따져보면', '']],
  [/종합적으로/g, ['전체적으로 보면', '다 합쳐보면', '']],
  [/기본적으로/g, ['보통은', '일반적으로', '대체로']],
  [/핵심적으로/g, ['핵심은', '중요한 건', '']],
  [/궁극적으로/g, ['결국', '끝에 가서는', '']],
  [/무엇보다/g, ['그중에서도', '특히', '제일']],
  [/특히나/g, ['특히', '그중에서', '']],
  [/과언이 아닙니다/g, ['라고 해도 될 것 같아요', '라고 봐요', '']],
  [/살펴보겠습니다/g, ['얘기해볼게요', '알려드릴게요', '써볼게요']],
  [/알아보겠습니다/g, ['얘기해볼게요', '풀어볼게요', '정리해볼게요']],
  [/하는 것이 좋습니다/g, ['하는 게 좋아요', '하시는 걸 추천해요', '해보세요']],
  [/할 수 있습니다/g, ['할 수 있어요', '가능해요', '됩니다']],
  [/이러한/g, ['이런', '이같은', '']],
  [/그러한/g, ['그런', '그같은', '']],
  [/확인해 보시기 바랍니다/g, ['확인해보세요', '체크해보시는 것도 좋아요', '']],
];

/** 1인칭 경험 표현 삽입 후보 */
const EXPERIENCE_PHRASES = [
  '제가 직접 해봤는데',
  '솔직히 말하면',
  '개인적으로는',
  '써보니까',
  '해보니까 확실히',
  '실제로 경험해보면',
  '제 경우에는',
  '직접 사용해본 결과',
];

/** A단계: AI 어휘 패턴 탐지 & 구어체 치환 */
function replaceAIVocab(text: string): { text: string; changes: NaturalizationChange[] } {
  const changes: NaturalizationChange[] = [];
  let result = text;

  for (const [pattern, replacements] of VOCAB_REPLACEMENTS) {
    const matches = result.match(pattern);
    if (matches) {
      for (const match of matches) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        const original = match;
        result = result.replace(match, replacement);
        if (replacement !== original) {
          changes.push({ type: 'vocab', original, replaced: replacement || '(삭제)' });
        }
      }
    }
  }

  return { text: result, changes };
}

/** B단계: 문장 길이 변동 삽입 */
function mixSentenceLengths(text: string): { text: string; changes: NaturalizationChange[] } {
  const changes: NaturalizationChange[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  // 5문장마다 짧은 문장 삽입 고려
  let result = '';
  let count = 0;
  for (const sentence of sentences) {
    result += sentence + ' ';
    count++;
    if (count % 5 === 0 && Math.random() > 0.5) {
      const shortPhrases = ['진짜요.', '솔직히.', '그렇더라고요.', '맞아요.', '확실해요.'];
      const phrase = shortPhrases[Math.floor(Math.random() * shortPhrases.length)];
      result += phrase + ' ';
      changes.push({ type: 'sentence', original: '', replaced: phrase });
    }
  }

  return { text: result.trim(), changes };
}

/** C단계: 1인칭 경험 표현 삽입 */
function insertExperiencePhrases(text: string): { text: string; changes: NaturalizationChange[] } {
  const changes: NaturalizationChange[] = [];
  const paragraphs = text.split('\n\n');

  // 전체 문단의 20% 정도에만 삽입
  const targetCount = Math.max(1, Math.floor(paragraphs.length * 0.2));
  const insertIndices = new Set<number>();
  while (insertIndices.size < targetCount && insertIndices.size < paragraphs.length) {
    const idx = Math.floor(Math.random() * paragraphs.length);
    // 제목이나 소제목 문단은 건너뜀
    if (!paragraphs[idx].startsWith('#')) {
      insertIndices.add(idx);
    }
  }

  const result = paragraphs.map((p, i) => {
    if (insertIndices.has(i) && !p.startsWith('#') && p.length > 50) {
      // 이미 경험 표현이 있으면 건너뜀
      if (EXPERIENCE_PHRASES.some(ep => p.includes(ep))) return p;

      const phrase = EXPERIENCE_PHRASES[Math.floor(Math.random() * EXPERIENCE_PHRASES.length)];
      const sentences = p.split(/(?<=[.!?])\s+/);
      if (sentences.length >= 2) {
        const insertAt = Math.min(1, sentences.length - 1);
        sentences.splice(insertAt, 0, phrase + ',');
        changes.push({ type: 'experience', original: '', replaced: phrase });
        return sentences.join(' ');
      }
    }
    return p;
  });

  return { text: result.join('\n\n'), changes };
}

/** 자연화 점수 계산 (0-100) */
export function calculateNaturalizationScore(original: string, naturalized: string): number {
  let score = 50; // 기본 점수

  // AI 패턴 잔존 확인
  const aiPatterns = ['이로써', '결론적으로', '종합적으로', '기본적으로', '핵심적으로', '궁극적으로', '살펴보겠습니다', '알아보겠습니다'];
  const remainingPatterns = aiPatterns.filter(p => naturalized.includes(p));
  score += Math.min(20, (aiPatterns.length - remainingPatterns.length) * 3);

  // 문장 길이 변동성 확인
  const sentences = naturalized.split(/(?<=[.!?])\s+/);
  const lengths = sentences.map(s => s.length);
  if (lengths.length > 2) {
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    // 높은 표준편차 = 더 자연스러움
    score += Math.min(15, Math.floor(stdDev / 5));
  }

  // 경험 표현 포함 여부
  const expPhraseCount = EXPERIENCE_PHRASES.filter(p => naturalized.includes(p)).length;
  score += Math.min(15, expPhraseCount * 5);

  return Math.min(100, Math.max(0, score));
}

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
