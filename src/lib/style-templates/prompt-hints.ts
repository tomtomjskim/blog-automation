import type { StyleId, TemplateData } from '@/lib/types';

/** 값 해석 힌트 + 조건부 프롬프트 블록 생성 */
export function buildPromptHints(data: TemplateData, style: StyleId): string {
  const hints: string[] = [];

  if (style === 'food_review' || style === 'review') {
    const ratingStr = data['rating']?.trim();
    if (ratingStr) {
      const rating = parseFloat(ratingStr);
      if (!isNaN(rating)) {
        if (rating >= 4.5) {
          hints.push('(높은 만족도 반영, 객관성 유지)');
        } else if (rating <= 2.5) {
          hints.push('(실망감 솔직하게, 건설적으로)');
        }
      }
    }
  }

  if (style === 'review') {
    const repurchase = data['repurchase']?.trim();
    if (repurchase === 'X') {
      hints.push('(재구매 의사 없음 이유 구체적 설명)');
    }

    const pros = data['pros']?.trim();
    const cons = data['cons']?.trim();
    if (pros && !cons) {
      hints.push('(단점도 1-2개 언급하여 균형 유지)');
    }
  }

  if (style === 'food_review') {
    const revisit = data['revisit']?.trim();
    if (revisit === 'X') {
      hints.push('(재방문 의사 없음 이유 구체적 설명)');
    }

    const location = data['location']?.trim();
    if (location) {
      hints.push('(찾아가는 길 상세 작성)');
    } else {
      hints.push("(위치는 '[확인 필요]'로 표시)");
    }

    const hours = data['hours']?.trim();
    if (!hours) {
      hints.push("(영업시간은 '방문 전 확인 권장'으로 표시)");
    }
  }

  if (style === 'review') {
    const howToGet = data['how_to_get']?.trim();
    if (!howToGet) {
      hints.push('(구매처 정보 생략)');
    }
  }

  if (hints.length === 0) return '';
  return `\n## 작성 힌트\n${hints.map(h => `- ${h}`).join('\n')}\n`;
}
