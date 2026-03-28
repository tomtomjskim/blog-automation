import type { NaturalizationChange } from '@/lib/types';

/** AI 특유 어휘 패턴 → 구어체 치환 사전 */
export const VOCAB_REPLACEMENTS: Array<[RegExp, string[]]> = [
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

/** A단계: AI 어휘 패턴 탐지 & 구어체 치환 */
export function replaceAIVocab(text: string): { text: string; changes: NaturalizationChange[] } {
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
