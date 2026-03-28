import type { NaturalizationChange } from '@/lib/types';

/** 1인칭 경험 표현 삽입 후보 */
export const EXPERIENCE_PHRASES = [
  '제가 직접 해봤는데',
  '솔직히 말하면',
  '개인적으로는',
  '써보니까',
  '해보니까 확실히',
  '실제로 경험해보면',
  '제 경우에는',
  '직접 사용해본 결과',
];

/** 페르소나별 경험 표현 후보 (확장용) */
export const PERSONA_EXPERIENCE_PHRASES: Record<string, string[]> = {
  expert: ['전문가 입장에서', '오랜 경험으로 보면', '실무에서 느낀 바로는'],
  casual: ['솔직히 말하면', '개인적으로는', '제 경우에는'],
  storyteller: ['제가 직접 해봤는데', '써보니까', '실제로 경험해보면'],
};

/** C단계: 1인칭 경험 표현 삽입 */
export function insertExperiencePhrases(text: string): { text: string; changes: NaturalizationChange[] } {
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
