import { EXPERIENCE_PHRASES } from './stages/experience-inserter';

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

/** 접속사 다양성 점수 계산 (보조 함수) */
export function calcConjunctionDiversityScore(text: string): number {
  const conjunctions = ['그리고', '하지만', '따라서', '또한'];
  let totalCount = 0;
  let uniqueCount = 0;

  for (const conj of conjunctions) {
    const count = (text.match(new RegExp(conj, 'g')) || []).length;
    if (count > 0) {
      uniqueCount++;
      totalCount += count;
    }
  }

  if (totalCount === 0) return 10;
  // 다양한 접속사 사용 시 높은 점수
  return Math.min(10, Math.floor((uniqueCount / conjunctions.length) * 10));
}
