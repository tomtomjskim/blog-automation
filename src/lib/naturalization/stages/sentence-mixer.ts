import type { NaturalizationChange } from '@/lib/types';

/** B단계: 문장 길이 변동 삽입 */
export function mixSentenceLengths(text: string): { text: string; changes: NaturalizationChange[] } {
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
