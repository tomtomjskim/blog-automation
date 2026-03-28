export interface SeoCheckResult {
  name: string;
  score: number;
  maxScore: number;
  suggestion?: string;
}

export type SeoChecker = (content: string, keywords: string[], title?: string) => SeoCheckResult;

/** 제목 길이 체크: 15-25자 최적 (10점) */
export function checkTitleLength(_content: string, _keywords: string[], title = ''): SeoCheckResult {
  if (title.length >= 15 && title.length <= 25) {
    return { name: '제목 길이', score: 10, maxScore: 10 };
  } else if (title.length > 0 && title.length < 15) {
    return {
      name: '제목 길이',
      score: 5,
      maxScore: 10,
      suggestion: `제목을 ${15 - title.length}자 더 늘려보세요 (현재 ${title.length}자)`,
    };
  } else if (title.length > 25) {
    return {
      name: '제목 길이',
      score: 5,
      maxScore: 10,
      suggestion: `제목을 ${title.length - 25}자 줄여보세요 (현재 ${title.length}자)`,
    };
  }
  return { name: '제목 길이', score: 0, maxScore: 10, suggestion: '# 마크다운으로 제목을 추가하세요' };
}

/** 제목 키워드 선두 배치 체크 (10점) */
export function checkTitleKeyword(_content: string, keywords: string[], title = ''): SeoCheckResult {
  if (keywords.length === 0) return { name: '제목 키워드', score: 0, maxScore: 10 };

  const firstKeyword = keywords[0];
  if (
    title.toLowerCase().startsWith(firstKeyword.toLowerCase()) ||
    title.toLowerCase().indexOf(firstKeyword.toLowerCase()) <= 3
  ) {
    return { name: '제목 키워드', score: 10, maxScore: 10 };
  } else if (title.toLowerCase().includes(firstKeyword.toLowerCase())) {
    return {
      name: '제목 키워드',
      score: 6,
      maxScore: 10,
      suggestion: '제목 앞부분에 주키워드를 배치하면 SEO에 유리합니다',
    };
  }
  return { name: '제목 키워드', score: 0, maxScore: 10, suggestion: '제목에 주키워드를 포함하세요' };
}
