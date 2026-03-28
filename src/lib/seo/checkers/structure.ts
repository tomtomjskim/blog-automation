import type { SeoChecker } from './title';

/** H2 구조 3-5개 체크 (10점) */
export const checkH2Structure: SeoChecker = (content, _keywords, _title) => {
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)];

  if (headings.length >= 3 && headings.length <= 5) {
    return { name: 'H2 구조', score: 10, maxScore: 10 };
  } else if (headings.length > 5) {
    return {
      name: 'H2 구조',
      score: 7,
      maxScore: 10,
      suggestion: '소제목이 많습니다. 관련 섹션을 병합하여 3-5개로 줄여보세요',
    };
  } else if (headings.length > 0) {
    return {
      name: 'H2 구조',
      score: 5,
      maxScore: 10,
      suggestion: `소제목을 ${3 - headings.length}개 더 추가하여 글을 구조화하세요`,
    };
  }
  return { name: 'H2 구조', score: 0, maxScore: 10, suggestion: '## 소제목으로 글을 3-5개 섹션으로 나누세요' };
};
