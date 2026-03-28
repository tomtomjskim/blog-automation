import type { NaturalizationChange } from '@/lib/types';

/** 접속사 대안 목록 */
export const CONJUNCTION_ALTERNATIVES: Record<string, string[]> = {
  그리고: ['또한', '아울러', '게다가'],
  하지만: ['그런데', '반면에', '다만'],
  따라서: ['그래서', '이에 따라', '덕분에'],
  또한: ['그리고', '게다가', '아울러'],
};

/** D단계: 반복 접속사 다양화 */
export function fixRepetitiveConjunctions(text: string): { text: string; changes: NaturalizationChange[] } {
  const changes: NaturalizationChange[] = [];
  let result = text;

  for (const [conjunction, alternatives] of Object.entries(CONJUNCTION_ALTERNATIVES)) {
    const pattern = new RegExp(conjunction, 'g');
    const matches = result.match(pattern);
    if (matches && matches.length > 2) {
      // 3회 이상 반복 시 일부 교체
      let replaceCount = 0;
      result = result.replace(pattern, (match) => {
        replaceCount++;
        if (replaceCount > 1 && replaceCount % 2 === 0) {
          const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
          changes.push({ type: 'vocab', original: match, replaced: alt });
          return alt;
        }
        return match;
      });
    }
  }

  return { text: result, changes };
}
