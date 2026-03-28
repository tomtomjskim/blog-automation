import type { SeoCheckResult, SeoChecker } from './title';

/** 본문 길이 체크: 2000자+ 최적 (15점) */
export const checkContentLength: SeoChecker = (content, _keywords, _title) => {
  const bodyText = content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/gm, '')
    .replace(/[#*_`\[\]()!]/g, '')
    .trim();
  const charCount = bodyText.replace(/\s/g, '').length;

  if (charCount >= 2000) {
    return { name: '본문 길이', score: 15, maxScore: 15 };
  } else if (charCount >= 1000) {
    return {
      name: '본문 길이',
      score: 8,
      maxScore: 15,
      suggestion: `본문을 ${(2000 - charCount).toLocaleString()}자 더 작성하면 네이버 상위노출에 유리합니다`,
    };
  }
  return {
    name: '본문 길이',
    score: 3,
    maxScore: 15,
    suggestion: '네이버 상위노출을 위해 최소 2000자 이상 작성하세요',
  };
};

/** 문단 길이 가독성 체크: 100-200자 단위 (10점) */
export const checkParagraphLength: SeoChecker = (content, _keywords, _title) => {
  const bodyText = content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/gm, '')
    .replace(/[#*_`\[\]()!]/g, '')
    .trim();
  const paragraphs = bodyText.split(/\n\n+/).filter((p) => p.trim().length > 30);

  if (paragraphs.length === 0) return { name: '문단 길이', score: 0, maxScore: 10 };

  const optimalParagraphs = paragraphs.filter((p) => {
    const len = p.replace(/\s/g, '').length;
    return len >= 80 && len <= 250;
  });
  const ratio = optimalParagraphs.length / paragraphs.length;

  if (ratio >= 0.6) {
    return { name: '문단 길이', score: 10, maxScore: 10 };
  }
  return {
    name: '문단 길이',
    score: 5,
    maxScore: 10,
    suggestion: '문단을 100-200자 단위로 나누면 모바일 가독성이 좋아집니다',
  };
};

export type { SeoCheckResult };
