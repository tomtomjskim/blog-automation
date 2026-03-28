import { runClaudeForBlog } from './claude';
import { buildNaturalizationPrompt } from './prompts';
import type { NaturalizationChange, PersonaId } from './types';

/** AI 특유 어휘 패턴 → 구어체 치환 사전 (40+ 패턴) */
const VOCAB_REPLACEMENTS: Array<[RegExp, string[]]> = [
  // --- 기존 18개 패턴 ---
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

  // --- 신규 추가 22개 패턴 ---
  [/그야말로/g, ['정말', '진짜', '']],
  [/한편/g, ['그런데', '반면에', '']],
  [/따라서/g, ['그래서', '그러니까', '']],
  [/또한/g, ['그리고', '또', '거기에']],
  [/즉/g, ['다시 말하면', '쉽게 말하면', '']],
  [/그럼에도 불구하고/g, ['그래도', '하지만', '']],
  [/뿐만 아니라/g, ['게다가', '더구나', '']],
  [/에 대해/g, ['에 관해서', '을 두고', '']],
  [/다소/g, ['좀', '약간', '조금']],
  [/상당한/g, ['꽤', '제법', '상당히']],
  [/수행합니다/g, ['해요', '합니다', '진행해요']],
  [/필수적입니다/g, ['꼭 해야 해요', '빼놓을 수 없어요', '']],
  [/효과적입니다/g, ['효과 좋아요', '잘 먹히더라고요', '']],
  [/적극 추천합니다/g, ['강추예요', '꼭 해보세요', '추천드려요']],
  [/주목할 만합니다/g, ['눈여겨볼 만해요', '관심 가져볼 만해요', '']],
  [/제공합니다/g, ['드려요', '알려드릴게요', '줘요']],
  [/활용하시기 바랍니다/g, ['활용해보세요', '한번 써보세요', '']],
  [/도움이 될 것입니다/g, ['도움이 될 거예요', '도움 되실 거예요', '']],
  [/고려하시기 바랍니다/g, ['고려해보세요', '생각해보시는 것도 좋아요', '']],
  [/하시길 바랍니다/g, ['해보세요', '하시는 걸 추천해요', '']],
  [/마무리하겠습니다/g, ['마무리할게요', '여기까지예요', '이만 줄일게요']],
  [/시작하겠습니다/g, ['시작해볼게요', '바로 들어갈게요', '']],
];

/** 범용 1인칭 경험 표현 삽입 후보 */
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

/** 페르소나별 맞춤 경험 표현 */
const PERSONA_EXPERIENCE_PHRASES: Record<string, string[]> = {
  beauty: ['직접 발라봤는데', '일주일간 써보니', '피부에 올려보니까', '메이크업해보니', '세안 후 느낌이'],
  food: ['직접 먹어봤는데', '한 입 먹자마자', '방문해보니', '주문해서 먹어보니', '맛을 보는 순간'],
  tech: ['직접 써봤는데', '한 달간 사용해보니', '설정해보니까', '테스트해본 결과', '실제로 돌려보니'],
  travel: ['직접 가봤는데', '여행해보니', '숙소에서 지내보니', '현지에서 느낀 건', '걸어다녀보니'],
  selfdev: ['직접 읽어봤는데', '실천해보니', '3개월간 해보니', '습관으로 만들어보니', '적용해본 결과'],
  parenting: ['아이와 해봤는데', '우리 아이한테 써보니', '실제로 적용해보니', '한 달간 시도해보니', '직접 경험해보니'],
  finance: ['직접 투자해봤는데', '3개월간 해보니', '실제 수익률을 보면', '가계부 써보니', '비교해본 결과'],
  interior: ['직접 꾸며봤는데', '배치해보니', '인테리어 해보니까', '실제로 적용해보면', '시공해본 경험으로는'],
};

/** 접속사 반복 교체 대안 맵 */
const CONJUNCTION_ALTERNATIVES: Record<string, string[]> = {
  또한: ['거기에', '더불어', ''],
  그리고: ['또', '거기다', ''],
  특히: ['그중에서도', '무엇보다', ''],
  먼저: ['우선', '일단', '첫번째로'],
  다음으로: ['이어서', '그다음은', ''],
  마지막으로: ['끝으로', '정리하면', ''],
  그래서: ['그러니까', '따라서', ''],
  하지만: ['그런데', '반면에', ''],
};

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

/** B-2단계: 접속사 반복 탐지 및 교체 */
function fixRepetitiveConjunctions(text: string): { text: string; changes: NaturalizationChange[] } {
  const changes: NaturalizationChange[] = [];
  const paragraphs = text.split('\n\n');
  const conjunctionList = Object.keys(CONJUNCTION_ALTERNATIVES);

  // 각 접속사별로 연속 등장 여부를 추적
  for (const conjunction of conjunctionList) {
    // 각 문단이 해당 접속사로 시작하는지 확인
    const startsWithConj = paragraphs.map(p => {
      const trimmed = p.trimStart();
      // 마크다운 제목 제외
      if (trimmed.startsWith('#')) return false;
      return trimmed.startsWith(conjunction);
    });

    // 연속 3개 이상 구간 탐지 → 3번째부터 교체
    let consecutiveCount = 0;
    for (let i = 0; i < startsWithConj.length; i++) {
      if (startsWithConj[i]) {
        consecutiveCount++;
        if (consecutiveCount >= 3) {
          // 교체 수행
          const alternatives = CONJUNCTION_ALTERNATIVES[conjunction].filter(a => a !== '');
          if (alternatives.length === 0) {
            // 빈 문자열 대안만 있는 경우: 접속사 제거
            const trimmed = paragraphs[i].trimStart();
            const leadingWhitespace = paragraphs[i].slice(0, paragraphs[i].length - trimmed.length);
            paragraphs[i] = leadingWhitespace + trimmed.slice(conjunction.length).trimStart();
            changes.push({ type: 'conjunction', original: conjunction, replaced: '(삭제)' });
          } else {
            const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
            const trimmed = paragraphs[i].trimStart();
            const leadingWhitespace = paragraphs[i].slice(0, paragraphs[i].length - trimmed.length);
            paragraphs[i] = leadingWhitespace + trimmed.replace(conjunction, replacement);
            changes.push({ type: 'conjunction', original: conjunction, replaced: replacement });
          }
        }
      } else {
        consecutiveCount = 0;
      }
    }
  }

  return { text: paragraphs.join('\n\n'), changes };
}

/** C단계: 1인칭 경험 표현 삽입 */
function insertExperiencePhrases(
  text: string,
  persona?: PersonaId | null,
): { text: string; changes: NaturalizationChange[] } {
  const changes: NaturalizationChange[] = [];
  const paragraphs = text.split('\n\n');

  // 페르소나가 있고 해당 표현 세트가 있으면 우선 사용, 없으면 범용 표현 사용
  const phraseSet =
    persona && PERSONA_EXPERIENCE_PHRASES[persona]
      ? PERSONA_EXPERIENCE_PHRASES[persona]
      : EXPERIENCE_PHRASES;

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

  // 모든 경험 표현 목록 (범용 + 페르소나별) - 이미 삽입된 표현 중복 방지에 사용
  const allExperiencePhrases = [
    ...EXPERIENCE_PHRASES,
    ...Object.values(PERSONA_EXPERIENCE_PHRASES).flat(),
  ];

  const result = paragraphs.map((p, i) => {
    if (insertIndices.has(i) && !p.startsWith('#') && p.length > 50) {
      // 이미 경험 표현이 있으면 건너뜀
      if (allExperiencePhrases.some(ep => p.includes(ep))) return p;

      const phrase = phraseSet[Math.floor(Math.random() * phraseSet.length)];
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

/**
 * 접속사 다양성 점수 계산 (0-10)
 * 연속 반복 없으면 10, 약간 반복 5, 심한 반복 0
 */
function calcConjunctionDiversityScore(text: string): number {
  const paragraphs = text.split('\n\n').filter(p => !p.trimStart().startsWith('#') && p.trim().length > 0);
  const conjunctionList = Object.keys(CONJUNCTION_ALTERNATIVES);

  let maxConsecutive = 0;
  for (const conjunction of conjunctionList) {
    let consecutive = 0;
    let localMax = 0;
    for (const p of paragraphs) {
      if (p.trimStart().startsWith(conjunction)) {
        consecutive++;
        if (consecutive > localMax) localMax = consecutive;
      } else {
        consecutive = 0;
      }
    }
    if (localMax > maxConsecutive) maxConsecutive = localMax;
  }

  if (maxConsecutive <= 1) return 10;
  if (maxConsecutive === 2) return 5;
  return 0;
}

/** 자연화 점수 계산 (0-100) */
export function calculateNaturalizationScore(original: string, naturalized: string): number {
  // 기본 점수: 30
  let score = 30;

  // AI 패턴 잔존 확인 (최대 30점, 15개 패턴 × 2점)
  const aiPatterns = [
    '이로써', '결론적으로', '종합적으로', '기본적으로', '핵심적으로',
    '궁극적으로', '살펴보겠습니다', '알아보겠습니다',
    // 신규 추가 패턴
    '그야말로', '따라서', '즉', '그럼에도 불구하고', '뿐만 아니라',
    '필수적입니다', '효과적입니다',
  ];
  const remainingPatterns = aiPatterns.filter(p => naturalized.includes(p));
  score += Math.min(30, (aiPatterns.length - remainingPatterns.length) * 2);

  // 문장 길이 변동성 확인 (최대 15점)
  const sentences = naturalized.split(/(?<=[.!?])\s+/);
  const lengths = sentences.map(s => s.length);
  if (lengths.length > 2) {
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    // 높은 표준편차 = 더 자연스러움
    score += Math.min(15, Math.floor(stdDev / 5));
  }

  // 경험 표현 포함 여부 (최대 15점)
  const allExperiencePhrases = [
    ...EXPERIENCE_PHRASES,
    ...Object.values(PERSONA_EXPERIENCE_PHRASES).flat(),
  ];
  const expPhraseCount = allExperiencePhrases.filter(p => naturalized.includes(p)).length;
  score += Math.min(15, expPhraseCount * 5);

  // 접속사 다양성 (최대 10점)
  score += calcConjunctionDiversityScore(naturalized);

  return Math.min(100, Math.max(0, score));
}

/** 4단계 자연화 파이프라인 (규칙 기반) */
function ruleBasedNaturalize(
  content: string,
  persona?: PersonaId | null,
): { text: string; changes: NaturalizationChange[] } {
  const allChanges: NaturalizationChange[] = [];

  // A: AI 어휘 치환
  const vocabResult = replaceAIVocab(content);
  allChanges.push(...vocabResult.changes);

  // B: 문장 길이 변동
  const sentenceResult = mixSentenceLengths(vocabResult.text);
  allChanges.push(...sentenceResult.changes);

  // B-2: 접속사 반복 탐지 및 교체
  const conjResult = fixRepetitiveConjunctions(sentenceResult.text);
  allChanges.push(...conjResult.changes);

  // C: 경험 표현 삽입 (페르소나 반영)
  const expResult = insertExperiencePhrases(conjResult.text, persona);
  allChanges.push(...expResult.changes);

  return { text: expResult.text, changes: allChanges };
}

/** 전체 자연화 파이프라인 (규칙 기반 + Claude 최종 처리) */
export async function naturalizeContent(
  content: string,
  persona?: PersonaId | null,
): Promise<{
  naturalizedContent: string;
  score: number;
  changes: NaturalizationChange[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}> {
  // 1단계: 규칙 기반 자연화
  const { text: ruleBasedText, changes } = ruleBasedNaturalize(content, persona);

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
