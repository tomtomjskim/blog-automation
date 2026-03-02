/** 키워드 포함 alt 텍스트 자동 생성 */
export function generateAutoAltText(description: string, keywords: string[]): string {
  if (keywords.length === 0) return description;

  const primaryKw = keywords[0];
  // 이미 키워드가 포함되어 있으면 그대로 반환
  if (description.toLowerCase().includes(primaryKw.toLowerCase())) {
    return description;
  }
  // 키워드를 자연스럽게 앞에 추가
  return `${primaryKw} - ${description}`;
}

/** 글 길이 대비 이미지 수 권장 */
export function suggestNaverImageCount(charCount: number): { min: number; max: number; optimal: number } {
  if (charCount < 1000) return { min: 3, max: 5, optimal: 3 };
  if (charCount < 2000) return { min: 4, max: 8, optimal: 6 };
  if (charCount < 3000) return { min: 6, max: 10, optimal: 8 };
  return { min: 8, max: 13, optimal: 10 };
}

/** SEO 친화 파일명 생성 (네이버 이미지 검색 최적화) */
export function buildNaverFilename(topic: string, index: number, keywords: string[]): string {
  // 한글 + 영문 + 숫자만 남기고 공백을 하이픈으로
  const base = keywords.length > 0 ? keywords[0] : topic;
  const clean = base
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
  return `${clean}-${index + 1}`;
}

/** 이미지 배치 가이드 생성 */
export function getImagePlacementGuide(headingCount: number): string[] {
  const placements: string[] = ['도입부 직후 (썸네일용, 3:2 비율 권장)'];
  for (let i = 0; i < Math.min(headingCount, 5); i++) {
    placements.push(`H2 섹션 ${i + 1} 뒤`);
  }
  return placements;
}
